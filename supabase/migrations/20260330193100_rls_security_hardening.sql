-- ============================================================
-- RLS Security Hardening Migration
-- RelatórioFlow — 2026-03-30
-- ============================================================

-- ============================================================
-- FIX 1 (CRÍTICO): Remover INSERT policy de notifications para
-- usuários autenticados normais. Apenas triggers SECURITY DEFINER
-- (service_role) devem inserir notificações.
-- ============================================================
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- ============================================================
-- FIX 2 (MODERADO): report_executions — adicionar UPDATE policy
-- para que o front-end consiga atualizar status de execuções
-- ============================================================
DROP POLICY IF EXISTS "Users can update org executions" ON public.report_executions;
CREATE POLICY "Users can update org executions"
  ON public.report_executions FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- ============================================================
-- FIX 3 (MODERADO): support_tickets — trocar FOR ALL por
-- policies granulares, bloqueando DELETE para usuários normais
-- ============================================================
DROP POLICY IF EXISTS "user sees own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "admin sees all tickets" ON public.support_tickets;

-- Usuários podem ver e criar tickets da própria org
CREATE POLICY "user can read own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "user can create own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND user_id = auth.uid());

CREATE POLICY "user can update own tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id())
  WITH CHECK (org_id = get_user_org_id());

-- Admin vê e gerencia tudo
CREATE POLICY "admin manages all tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================================
-- FIX 4 (MODERADO): support_messages — mesmo padrão granular
-- ============================================================
DROP POLICY IF EXISTS "user sees own ticket messages" ON public.support_messages;
DROP POLICY IF EXISTS "admin sees all messages" ON public.support_messages;

CREATE POLICY "user can read own ticket messages"
  ON public.support_messages FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE org_id = get_user_org_id()
    )
  );

CREATE POLICY "user can send messages to own tickets"
  ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    ticket_id IN (
      SELECT id FROM public.support_tickets
      WHERE org_id = get_user_org_id()
    )
  );

CREATE POLICY "user can update own messages"
  ON public.support_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

-- Admin gerencia tudo
CREATE POLICY "admin manages all messages"
  ON public.support_messages FOR ALL TO authenticated
  USING (public.is_admin());

-- ============================================================
-- FIX 5 (AVISO): api_keys — trocar subquery por get_user_org_id()
-- para aproveitar cache da função e melhorar performance
-- ============================================================
DROP POLICY IF EXISTS "org sees own keys" ON public.api_keys;

CREATE POLICY "org members can read own keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "org members can create keys"
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id() AND created_by = auth.uid());

CREATE POLICY "org members can update keys"
  ON public.api_keys FOR UPDATE TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "org members can delete keys"
  ON public.api_keys FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- ============================================================
-- FIX 6 (MODERADO): Storage — adicionar isolamento por org_id
-- no path dos arquivos para logos e org-assets.
-- Convenção: o primeiro segmento do path deve ser o org_id.
-- Ex: logos/{org_id}/logo.png
-- ============================================================

-- LOGOS bucket
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;

CREATE POLICY "Org users can upload own logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

CREATE POLICY "Org users can update own logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

CREATE POLICY "Org users can delete own logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

-- ORG-ASSETS bucket
DROP POLICY IF EXISTS "Users can upload org assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update org assets" ON storage.objects;

CREATE POLICY "Org users can upload own assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

CREATE POLICY "Org users can update own assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-assets' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

CREATE POLICY "Org users can delete own assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-assets' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

-- REPORT-IMAGES bucket
DROP POLICY IF EXISTS "Authenticated users can upload report images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their report images" ON storage.objects;

CREATE POLICY "Org users can upload own report images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-images' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );

CREATE POLICY "Org users can delete own report images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-images' AND
    (storage.foldername(name))[1] = (get_user_org_id())::text
  );
