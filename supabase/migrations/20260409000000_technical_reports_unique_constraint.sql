-- Add UNIQUE constraint to technical_reports so upsert(onConflict:'project_id,numero_relatorio') works correctly
ALTER TABLE public.technical_reports
  DROP CONSTRAINT IF EXISTS technical_reports_project_id_numero_relatorio_key;

ALTER TABLE public.technical_reports
  ADD CONSTRAINT technical_reports_project_id_numero_relatorio_key
  UNIQUE (project_id, numero_relatorio);
