-- ============================================================
-- 1. Sync missing columns on generated_reports
-- ============================================================
ALTER TABLE public.generated_reports
  ADD COLUMN IF NOT EXISTS report_type       text DEFAULT 'relatorio_tecnico',
  ADD COLUMN IF NOT EXISTS report_number     text,
  ADD COLUMN IF NOT EXISTS report_date       date,
  ADD COLUMN IF NOT EXISTS report_location   text,
  ADD COLUMN IF NOT EXISTS responsible_name  text,
  ADD COLUMN IF NOT EXISTS responsible_role  text,
  ADD COLUMN IF NOT EXISTS client_company    text,
  ADD COLUMN IF NOT EXISTS client_contact    text,
  ADD COLUMN IF NOT EXISTS weather_condition text,
  ADD COLUMN IF NOT EXISTS access_condition  text,
  ADD COLUMN IF NOT EXISTS site_condition    text,
  ADD COLUMN IF NOT EXISTS team_members      jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS occurrences       text,
  ADD COLUMN IF NOT EXISTS materials         jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS images            jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS status            text DEFAULT 'concluido';

-- ============================================================
-- 2. Ensure RLS INSERT policy exists for generated_reports
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'generated_reports'
      AND cmd        = 'INSERT'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "generated_reports: owner insert"
        ON public.generated_reports FOR INSERT
        WITH CHECK (user_id = auth.uid())
    $policy$;
  END IF;
END;
$$;

-- ============================================================
-- 3. Create report-images storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-images',
  'report-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Storage RLS policies for report-images
-- ============================================================
DO $$
BEGIN
  -- Authenticated users can upload
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='report-images: authenticated upload') THEN
    CREATE POLICY "report-images: authenticated upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'report-images');
  END IF;

  -- Public read (bucket is public)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='report-images: public read') THEN
    CREATE POLICY "report-images: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'report-images');
  END IF;

  -- Authenticated update
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='report-images: authenticated update') THEN
    CREATE POLICY "report-images: authenticated update"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'report-images');
  END IF;

  -- Authenticated delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='report-images: authenticated delete') THEN
    CREATE POLICY "report-images: authenticated delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'report-images');
  END IF;
END;
$$;
