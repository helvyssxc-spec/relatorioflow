
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business', 'enterprise')),
  plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'past_due', 'canceled', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1A56DB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Data sources
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('csv_upload', 'google_sheets', 'manual')),
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Report templates
CREATE TABLE public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB DEFAULT '[]',
  brand_config JSONB DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  category TEXT CHECK (category IN ('financeiro', 'vendas', 'rh', 'marketing', 'operacional', 'custom')),
  thumbnail_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON public.report_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Schedules
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cron_expression TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'manual')),
  recipients JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Report executions
CREATE TABLE public.report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_format TEXT CHECK (file_format IN ('pdf', 'excel', 'docx')),
  recipients_sent JSONB DEFAULT '[]',
  error_message TEXT,
  executed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Payment events
CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Helper: get user org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- RLS Policies
CREATE POLICY "Users can view own org" ON public.organizations FOR SELECT TO authenticated USING (id = public.get_user_org_id());
CREATE POLICY "Owners can update own org" ON public.organizations FOR UPDATE TO authenticated USING (id = public.get_user_org_id());

CREATE POLICY "Users can view org members" ON public.profiles FOR SELECT TO authenticated USING (org_id = public.get_user_org_id() OR id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view org data sources" ON public.data_sources FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can create org data sources" ON public.data_sources FOR INSERT TO authenticated WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "Users can update org data sources" ON public.data_sources FOR UPDATE TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can delete org data sources" ON public.data_sources FOR DELETE TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can view org or public templates" ON public.report_templates FOR SELECT TO authenticated USING (org_id = public.get_user_org_id() OR is_public = true);
CREATE POLICY "Users can create org templates" ON public.report_templates FOR INSERT TO authenticated WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "Users can update org templates" ON public.report_templates FOR UPDATE TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can delete org templates" ON public.report_templates FOR DELETE TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can view org schedules" ON public.schedules FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can create org schedules" ON public.schedules FOR INSERT TO authenticated WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "Users can update org schedules" ON public.schedules FOR UPDATE TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can delete org schedules" ON public.schedules FOR DELETE TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can view org executions" ON public.report_executions FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());
CREATE POLICY "Users can create org executions" ON public.report_executions FOR INSERT TO authenticated WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Users can view org subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can view org payment events" ON public.payment_events FOR SELECT TO authenticated USING (org_id = public.get_user_org_id());

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
DELETE FROM public.profiles WHERE org_id IS NULL;

-- Create generated_reports table to store report history
CREATE TABLE public.generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_text text NOT NULL,
  client_name text,
  report_content text NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own org reports"
  ON public.generated_reports FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can view own org reports"
  ON public.generated_reports FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own org reports"
  ON public.generated_reports FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_config jsonb DEFAULT '{}'::jsonb;

INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload org assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org-assets');
CREATE POLICY "Users can view org assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'org-assets');
CREATE POLICY "Users can update org assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'org-assets');
CREATE POLICY "Public can view org assets" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'org-assets');
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS pagbank_order_id text,
  ADD COLUMN IF NOT EXISTS pagbank_card_token text,
  ADD COLUMN IF NOT EXISTS pagbank_charge_id text,
  ADD COLUMN IF NOT EXISTS card_last_digits text,
  ADD COLUMN IF NOT EXISTS card_brand text;

CREATE POLICY "Users can insert org subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update org subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (org_id = get_user_org_id());

CREATE POLICY "Anon can insert payment events" ON public.payment_events
  FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Anon can insert payment events" ON public.payment_events;
-- Security definer function to check if user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND email = 'helvyssxc@gmail.com'
  )
$$;

-- Allow admin to view ALL profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id() OR id = auth.uid());

-- Allow admin to view ALL organizations
CREATE POLICY "Admin can view all orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (is_admin() OR id = get_user_org_id());

-- Allow admin to update ALL organizations (for plan changes etc)
CREATE POLICY "Admin can update all orgs" ON public.organizations
  FOR UPDATE TO authenticated
  USING (is_admin());

-- Allow admin to view ALL subscriptions
CREATE POLICY "Admin can view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id());

-- Allow admin to update ALL subscriptions
CREATE POLICY "Admin can update all subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (is_admin());

-- Allow admin to view ALL payment events
CREATE POLICY "Admin can view all payment events" ON public.payment_events
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id());

-- Allow admin to view ALL generated reports (for metrics)
CREATE POLICY "Admin can view all reports" ON public.generated_reports
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id());
-- Drop old duplicate policies that are now covered by admin-aware ones
DROP POLICY IF EXISTS "Users can view org members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own org" ON public.organizations;
DROP POLICY IF EXISTS "Users can view org subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view org payment events" ON public.payment_events;
DROP POLICY IF EXISTS "Users can view own org reports" ON public.generated_reports;

-- Add new columns to generated_reports
ALTER TABLE generated_reports
  ADD COLUMN IF NOT EXISTS report_type        text DEFAULT 'relatorio_tecnico',
  ADD COLUMN IF NOT EXISTS report_number      text,
  ADD COLUMN IF NOT EXISTS report_date        date,
  ADD COLUMN IF NOT EXISTS report_location    text,
  ADD COLUMN IF NOT EXISTS responsible_name   text,
  ADD COLUMN IF NOT EXISTS responsible_role   text,
  ADD COLUMN IF NOT EXISTS client_company     text,
  ADD COLUMN IF NOT EXISTS client_contact     text,
  ADD COLUMN IF NOT EXISTS weather_condition  text,
  ADD COLUMN IF NOT EXISTS access_condition   text,
  ADD COLUMN IF NOT EXISTS site_condition     text,
  ADD COLUMN IF NOT EXISTS team_members       jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS occurrences        text,
  ADD COLUMN IF NOT EXISTS materials          jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS images             jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS folder_id          uuid,
  ADD COLUMN IF NOT EXISTS status             text DEFAULT 'concluido';

-- Create report_folders table
CREATE TABLE IF NOT EXISTS report_folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text DEFAULT '#1A56DB',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can manage folders"
  ON report_folders FOR ALL
  USING (org_id = get_user_org_id());

-- Foreign key for folder_id
ALTER TABLE generated_reports
  ADD CONSTRAINT fk_report_folder
  FOREIGN KEY (folder_id) REFERENCES report_folders(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_reports_folder ON generated_reports(folder_id);
CREATE INDEX IF NOT EXISTS idx_reports_type   ON generated_reports(org_id, report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date   ON generated_reports(org_id, report_date DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('report-images', 'report-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload report images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-images');

CREATE POLICY "Anyone can view report images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'report-images');

CREATE POLICY "Users can delete their report images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-images');
-- Allow users to update their own org's reports (for moving to folders)
CREATE POLICY "Users can update own org reports"
ON public.generated_reports
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- Allow users to delete their own org's folders
CREATE POLICY "Users can delete org folders"
ON public.report_folders
FOR DELETE
TO authenticated
USING (org_id = get_user_org_id());
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

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Service role inserts notifications via triggers
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify when report is generated
CREATE OR REPLACE FUNCTION public.notify_report_generated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, org_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    NEW.org_id,
    'report',
    'Relatório gerado com sucesso',
    'Seu ' || COALESCE(
      CASE NEW.report_type
        WHEN 'diario_de_obra' THEN 'Diário de Obra'
        WHEN 'vistoria' THEN 'Vistoria'
        WHEN 'laudo_tecnico' THEN 'Laudo Técnico'
        WHEN 'relatorio_tecnico' THEN 'Relatório Técnico'
        WHEN 'inspecao' THEN 'Inspeção'
        ELSE 'Relatório'
      END, 'Relatório'
    ) || ' foi gerado.',
    jsonb_build_object('report_id', NEW.id, 'report_type', NEW.report_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_report_generated
AFTER INSERT ON public.generated_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_report_generated();

-- Trigger: notify org owner when invitation is accepted
CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid;
  _invitee_email text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT id INTO _owner_id FROM public.profiles
    WHERE org_id = NEW.org_id AND role = 'owner' LIMIT 1;
    
    IF _owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, org_id, type, title, message, metadata)
      VALUES (
        _owner_id,
        NEW.org_id,
        'team',
        'Novo membro na equipe',
        NEW.email || ' aceitou o convite e entrou na equipe.',
        jsonb_build_object('email', NEW.email)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_invite_accepted
AFTER UPDATE ON public.team_invitations
FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.profiles(id),
  ticket_number  serial,
  subject        text NOT NULL,
  category       text NOT NULL DEFAULT 'duvida',
  status         text NOT NULL DEFAULT 'aberto',
  priority       text NOT NULL DEFAULT 'normal',
  archived       boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  resolved_at    timestamptz
);

-- Support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES public.profiles(id),
  sender_role  text NOT NULL DEFAULT 'user',
  content      text NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own tickets" ON public.support_tickets FOR ALL
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "admin sees all tickets" ON public.support_tickets FOR ALL
  USING (public.is_admin());

CREATE POLICY "user sees own ticket messages" ON public.support_messages FOR ALL
  USING (ticket_id IN (
    SELECT id FROM public.support_tickets
    WHERE org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "admin sees all messages" ON public.support_messages FOR ALL
  USING (public.is_admin());

-- Indexes for support
CREATE INDEX IF NOT EXISTS idx_tickets_org ON public.support_tickets(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON public.support_messages(ticket_id, created_at ASC);

-- Trigger: update ticket timestamp on new message
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_timestamp();

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_reports_org_date ON public.generated_reports(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_org_type ON public.generated_reports(org_id, report_type);
CREATE INDEX IF NOT EXISTS idx_reports_folder ON public.generated_reports(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC) WHERE read = false;

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_old_reports()
RETURNS void AS $$
BEGIN
  DELETE FROM public.generated_reports
  WHERE org_id IN (SELECT id FROM public.organizations WHERE plan = 'starter')
  AND created_at < now() - interval '30 days';

  DELETE FROM public.generated_reports
  WHERE org_id IN (SELECT id FROM public.organizations WHERE plan = 'pro')
  AND created_at < now() - interval '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications WHERE read = true AND created_at < now() - interval '30 days';
  DELETE FROM public.notifications WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.archive_old_tickets()
RETURNS void AS $$
BEGIN
  UPDATE public.support_tickets SET archived = true
  WHERE status IN ('resolvido', 'fechado')
  AND updated_at < now() - interval '6 months'
  AND archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES public.profiles(id),
  name        text NOT NULL DEFAULT 'Chave principal',
  key_hash    text NOT NULL UNIQUE,
  key_preview text NOT NULL,
  is_active   boolean DEFAULT true,
  last_used   timestamptz,
  created_at  timestamptz DEFAULT now(),
  revoked_at  timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org sees own keys"
  ON public.api_keys FOR ALL
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash) WHERE is_active = true;
