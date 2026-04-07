-- ============================================================
-- MVP Security & Audit Migration
-- Adaptada para o schema simplificado sem organizations:
--   profiles.id = auth.uid()
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Storage RLS — bucket "reports"
--    Acesso isolado por usuário: pasta = auth.uid()
-- ─────────────────────────────────────────────────────────────

-- Garante que o bucket existe (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "reports: owner select"  ON storage.objects;
DROP POLICY IF EXISTS "reports: owner insert"  ON storage.objects;
DROP POLICY IF EXISTS "reports: owner update"  ON storage.objects;
DROP POLICY IF EXISTS "reports: owner delete"  ON storage.objects;
DROP POLICY IF EXISTS "reports: user select"   ON storage.objects;
DROP POLICY IF EXISTS "reports: user insert"   ON storage.objects;
DROP POLICY IF EXISTS "reports: user update"   ON storage.objects;
DROP POLICY IF EXISTS "reports: user delete"   ON storage.objects;

-- SELECT: usuário lê apenas sua pasta /<uid>/...
CREATE POLICY "reports: user select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- INSERT: usuário faz upload apenas na sua pasta
CREATE POLICY "reports: user insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: usuário atualiza apenas seus arquivos
CREATE POLICY "reports: user update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: usuário remove apenas seus arquivos
CREATE POLICY "reports: user delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────
-- 2. Tabela audit_logs (MVP — sem organizations)
--    Rastreia eventos de segurança e ações críticas do usuário
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  -- Ações usadas: report.finalized, report.created, report.deleted,
  --               login.success, login.failure, settings.updated,
  --               checkout.started, checkout.completed
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Índices para queries por usuário e por data
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs (action, created_at DESC);

-- RLS: cada usuário vê apenas seus próprios logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs: user select" ON public.audit_logs;
CREATE POLICY "audit_logs: user select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuário pode inserir seus próprios logs de ação do frontend
DROP POLICY IF EXISTS "audit_logs: user insert" ON public.audit_logs;
CREATE POLICY "audit_logs: user insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role (edge functions) insere sem restrição de RLS
DROP POLICY IF EXISTS "audit_logs: service role insert" ON public.audit_logs;
CREATE POLICY "audit_logs: service role insert"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Função de log de auditoria (chamável do frontend via RPC)
--    Permite o cliente registrar eventos sem expor a tabela diretamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action   text,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, metadata)
  VALUES (auth.uid(), p_action, p_metadata);
END;
$$;

-- Garante que apenas usuários autenticados chamem a função
REVOKE EXECUTE ON FUNCTION public.log_audit_event FROM anon;
GRANT  EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Trigger: registra automaticamente quando um relatório
--    muda de status 'draft' → 'finalized'
--    Aplica a daily_reports e technical_reports
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_report_finalized()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table text := TG_TABLE_NAME;
BEGIN
  -- Dispara apenas quando status muda de 'draft' para não-draft
  IF (OLD.status = 'draft' OR OLD.status IS NULL)
     AND NEW.status IS NOT NULL
     AND NEW.status <> 'draft'
  THEN
    INSERT INTO public.audit_logs (user_id, action, metadata)
    VALUES (
      NEW.user_id,
      'report.finalized',
      jsonb_build_object(
        'table',      v_table,
        'report_id',  NEW.id,
        'status',     NEW.status,
        'title',      COALESCE(NEW.titulo, NEW.title, ''),
        'finalized_at', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Aplica trigger ao daily_reports (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_reports') THEN
    DROP TRIGGER IF EXISTS trg_daily_report_finalized ON public.daily_reports;
    CREATE TRIGGER trg_daily_report_finalized
      AFTER UPDATE OF status ON public.daily_reports
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_report_finalized();
  END IF;
END $$;

-- Aplica trigger ao technical_reports (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'technical_reports') THEN
    DROP TRIGGER IF EXISTS trg_technical_report_finalized ON public.technical_reports;
    CREATE TRIGGER trg_technical_report_finalized
      AFTER UPDATE OF status ON public.technical_reports
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_report_finalized();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. Trigger: registra criação de relatório
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_report_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, metadata)
  VALUES (
    NEW.user_id,
    'report.created',
    jsonb_build_object(
      'table',     TG_TABLE_NAME,
      'report_id', NEW.id,
      'title',     COALESCE(NEW.titulo, NEW.title, '')
    )
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_reports') THEN
    DROP TRIGGER IF EXISTS trg_daily_report_created ON public.daily_reports;
    CREATE TRIGGER trg_daily_report_created
      AFTER INSERT ON public.daily_reports
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_report_created();
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'technical_reports') THEN
    DROP TRIGGER IF EXISTS trg_technical_report_created ON public.technical_reports;
    CREATE TRIGGER trg_technical_report_created
      AFTER INSERT ON public.technical_reports
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_report_created();
  END IF;
END $$;
