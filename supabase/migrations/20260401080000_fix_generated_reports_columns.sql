-- Restore all columns that were added in migrations 20260327201748 and others,
-- but were lost when generated_reports was recreated in 20260401000000.
-- All statements use IF NOT EXISTS to be idempotent.

ALTER TABLE public.generated_reports
  ADD COLUMN IF NOT EXISTS report_type      text    DEFAULT 'relatorio_tecnico',
  ADD COLUMN IF NOT EXISTS report_number    text,
  ADD COLUMN IF NOT EXISTS report_date      date,
  ADD COLUMN IF NOT EXISTS report_location  text,
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS responsible_role text,
  ADD COLUMN IF NOT EXISTS client_company   text,
  ADD COLUMN IF NOT EXISTS client_contact   text,
  ADD COLUMN IF NOT EXISTS weather_condition text,
  ADD COLUMN IF NOT EXISTS access_condition  text,
  ADD COLUMN IF NOT EXISTS site_condition    text,
  ADD COLUMN IF NOT EXISTS team_members      jsonb  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS occurrences       text,
  ADD COLUMN IF NOT EXISTS materials         jsonb  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS images            jsonb  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status            text   DEFAULT 'concluido';

-- folder_id requires report_folders table to exist first
CREATE TABLE IF NOT EXISTS public.report_folders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        DEFAULT '#1A56DB',
  created_by uuid        REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.report_folders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'report_folders'
      AND policyname = 'members can manage folders'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "members can manage folders"
        ON public.report_folders FOR ALL
        USING (org_id = get_user_org_id())
    $p$;
  END IF;
END $$;

-- Add folder_id FK (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_report_folder'
  ) THEN
    ALTER TABLE public.generated_reports
      ADD COLUMN IF NOT EXISTS folder_id uuid,
      ADD CONSTRAINT fk_report_folder
        FOREIGN KEY (folder_id) REFERENCES public.report_folders(id) ON DELETE SET NULL;
  ELSE
    ALTER TABLE public.generated_reports
      ADD COLUMN IF NOT EXISTS folder_id uuid;
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_reports_folder ON public.generated_reports (folder_id);
CREATE INDEX IF NOT EXISTS idx_reports_type   ON public.generated_reports (org_id, report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date   ON public.generated_reports (org_id, report_date DESC);
