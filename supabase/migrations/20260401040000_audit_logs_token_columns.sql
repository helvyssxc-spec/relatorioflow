-- Add token tracking columns to audit_logs
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS tokens_input  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output integer DEFAULT 0;

COMMENT ON COLUMN public.audit_logs.action IS 'Ex: report.generated, report.improved, report.pdf_downloaded, report.quota_exceeded';
