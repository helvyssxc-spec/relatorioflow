
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
BEGIN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
