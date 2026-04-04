
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
