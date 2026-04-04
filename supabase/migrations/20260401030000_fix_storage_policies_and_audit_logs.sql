-- ============================================================
-- 1. Remove weaker storage policies added in 20260401020000
--    The org-isolated policies already exist and are stricter.
-- ============================================================
DROP POLICY IF EXISTS "report-images: authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "report-images: authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "report-images: authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "report-images: public read"          ON storage.objects;

-- ============================================================
-- 2. Audit logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id     uuid        REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id    uuid        REFERENCES public.profiles(id)      ON DELETE SET NULL,
  action     text        NOT NULL,  -- e.g. 'report.generated', 'settings.changed'
  metadata   jsonb       DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast per-org and per-user queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id     ON public.audit_logs (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs (user_id, created_at DESC);

-- RLS: admins see everything; users see only their own org logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: admin select"
  ON public.audit_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "audit_logs: org member select"
  ON public.audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Only backend (service role) inserts audit logs — no direct user inserts
-- INSERT via service role bypasses RLS automatically; no policy needed.
