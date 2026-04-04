-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES public.profiles(id),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(org_id, email)
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Members of the org can view invitations
CREATE POLICY "Users can view org invitations"
ON public.team_invitations FOR SELECT TO authenticated
USING (org_id = get_user_org_id());

-- Users can create invitations for their org
CREATE POLICY "Users can create org invitations"
ON public.team_invitations FOR INSERT TO authenticated
WITH CHECK (org_id = get_user_org_id());

-- Users can delete (cancel) invitations for their org
CREATE POLICY "Users can delete org invitations"
ON public.team_invitations FOR DELETE TO authenticated
USING (org_id = get_user_org_id());

-- Users can update invitations for their org
CREATE POLICY "Users can update org invitations"
ON public.team_invitations FOR UPDATE TO authenticated
USING (org_id = get_user_org_id());

-- Update handle_new_user to check for pending invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
  _company text;
  _slug text;
  _invite record;
BEGIN
  -- Check for a pending invitation
  SELECT * INTO _invite FROM public.team_invitations
  WHERE email = NEW.email AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF _invite IS NOT NULL THEN
    -- User was invited: join existing org
    INSERT INTO public.profiles (id, email, full_name, org_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      _invite.org_id,
      _invite.role
    );

    -- Mark invitation as accepted
    UPDATE public.team_invitations SET status = 'accepted' WHERE id = _invite.id;

    RETURN NEW;
  END IF;

  -- No invitation: create a new org (original behavior)
  _company := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''), 'Minha Empresa');
  _slug := LOWER(REGEXP_REPLACE(_company, '[^a-zA-Z0-9]+', '-', 'g'));
  _slug := TRIM(BOTH '-' FROM _slug);
  IF _slug = '' THEN
    _slug := 'org-' || EXTRACT(EPOCH FROM NOW())::bigint;
  END IF;
  _slug := _slug || '-' || LEFT(gen_random_uuid()::text, 8);

  INSERT INTO public.organizations (name, slug)
  VALUES (_company, _slug)
  RETURNING id INTO _org_id;

  INSERT INTO public.profiles (id, email, full_name, org_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    _org_id,
    'owner'
  );

  RETURN NEW;
END;
$$;