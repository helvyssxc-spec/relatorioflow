-- RelatorioFlow MVP: Migration adaptada para schema existente
-- profiles.id = auth.users.id (padrão do projeto atual)

-- Extensão
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Adicionar colunas MVP à tabela profiles existente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS crea_cau text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS has_access boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS pagbank_order_id text,
  ADD COLUMN IF NOT EXISTS access_granted_at timestamptz;

-- Tabela: projects (obras/projetos)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  address text,
  client_name text,
  art_rrt text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela: daily_reports (Diário de Obra / RDO)
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  report_date date NOT NULL,
  responsavel text NOT NULL DEFAULT '',
  condicao_tempo text DEFAULT 'bom',
  temperatura text DEFAULT '',
  clima_json jsonb DEFAULT '{}',
  equipe jsonb DEFAULT '[]',
  atividades jsonb DEFAULT '[]',
  equipamentos jsonb DEFAULT '[]',
  ocorrencias text DEFAULT '',
  fotos jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'finalizado')),
  pdf_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, report_date)
);

-- Tabela: technical_reports (Relatório Técnico)
CREATE TABLE IF NOT EXISTS public.technical_reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  numero_relatorio text NOT NULL DEFAULT '',
  report_date date NOT NULL,
  responsavel_tecnico text NOT NULL DEFAULT '',
  crea_cau text DEFAULT '',
  objetivo text DEFAULT '',
  metodologia text DEFAULT '',
  diagnostico jsonb DEFAULT '[]',
  conclusao text DEFAULT '',
  recomendacoes jsonb DEFAULT '[]',
  fotos_gerais jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'finalizado')),
  pdf_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela: reports_media (fotos e anexos)
CREATE TABLE IF NOT EXISTS public.reports_media (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('daily', 'technical')),
  report_id uuid NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  caption text DEFAULT '',
  file_type text DEFAULT 'photo',
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabela: pagbank_events (separada de payment_events que já existe)
CREATE TABLE IF NOT EXISTS public.pagbank_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pagbank_order_id text,
  event_type text NOT NULL,
  status text,
  amount integer,
  payload jsonb DEFAULT '{}',
  processed_at timestamptz DEFAULT now() NOT NULL
);

-- RLS: Habilitar nas novas tabelas
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagbank_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: projects
DROP POLICY IF EXISTS "projects: user owns own" ON public.projects;
CREATE POLICY "projects: user owns own" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: daily_reports
DROP POLICY IF EXISTS "daily_reports: user owns own" ON public.daily_reports;
CREATE POLICY "daily_reports: user owns own" ON public.daily_reports
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: technical_reports
DROP POLICY IF EXISTS "technical_reports: user owns own" ON public.technical_reports;
CREATE POLICY "technical_reports: user owns own" ON public.technical_reports
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: reports_media
DROP POLICY IF EXISTS "reports_media: user owns own" ON public.reports_media;
CREATE POLICY "reports_media: user owns own" ON public.reports_media
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: pagbank_events
DROP POLICY IF EXISTS "pagbank_events: user reads own" ON public.pagbank_events;
CREATE POLICY "pagbank_events: user reads own" ON public.pagbank_events
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger: criar profile automático no signup (se não existir)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: updated_at para novas tabelas
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS daily_reports_updated_at ON public.daily_reports;
CREATE TRIGGER daily_reports_updated_at BEFORE UPDATE ON public.daily_reports
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS technical_reports_updated_at ON public.technical_reports;
CREATE TRIGGER technical_reports_updated_at BEFORE UPDATE ON public.technical_reports
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Storage bucket para fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "reports storage: user uploads own" ON storage.objects;
CREATE POLICY "reports storage: user uploads own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "reports storage: public read" ON storage.objects;
CREATE POLICY "reports storage: public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports');

DROP POLICY IF EXISTS "reports storage: user deletes own" ON storage.objects;
CREATE POLICY "reports storage: user deletes own" ON storage.objects
  FOR DELETE USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);
