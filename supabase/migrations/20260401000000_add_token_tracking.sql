-- Ensure generated_reports table exists (may not have been created in earlier migration)
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_text text NOT NULL,
  client_name text,
  report_content text NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

-- Policies (IF NOT EXISTS not supported for policies — use DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'generated_reports'
      AND policyname = 'Users can insert own org reports'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own org reports"
      ON public.generated_reports FOR INSERT TO authenticated
      WITH CHECK (org_id = get_user_org_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'generated_reports'
      AND policyname = 'Users can view own org reports'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own org reports"
      ON public.generated_reports FOR SELECT TO authenticated
      USING (org_id = get_user_org_id())';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'generated_reports'
      AND policyname = 'Users can delete own org reports'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own org reports"
      ON public.generated_reports FOR DELETE TO authenticated
      USING (org_id = get_user_org_id())';
  END IF;
END $$;

-- Add token usage tracking columns
ALTER TABLE public.generated_reports
  ADD COLUMN IF NOT EXISTS tokens_input  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0;

-- Index for efficient admin queries on token sums
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at
  ON public.generated_reports (created_at DESC);
