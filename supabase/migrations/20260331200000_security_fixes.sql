-- ============================================================
-- Security Fixes Migration
-- RelatórioFlow — 2026-03-31
-- ============================================================

-- ============================================================
-- FIX 1 (CRÍTICO): Remover email hardcoded da função is_admin()
-- Adiciona coluna is_system_admin na tabela profiles e atualiza
-- a função para verificar essa coluna no banco de dados.
-- Isso remove o email do código SQL e permite trocar o admin
-- sem precisar alterar o banco manualmente.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_system_admin boolean NOT NULL DEFAULT false;

-- Promove o admin atual usando o e-mail via tabela auth.users
UPDATE public.profiles
  SET is_system_admin = true
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'helvyssxc@gmail.com'
  );

-- Recria a função sem email hardcoded
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_system_admin = true
  )
$$;

-- ============================================================
-- FIX 2 (CRÍTICO): Restringir leitura de umami_daily_stats
-- Estatísticas de analytics do site são dados internos —
-- apenas o admin do sistema deve visualizá-las.
-- ============================================================

DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.umami_daily_stats;

CREATE POLICY "Only admins can read analytics"
  ON public.umami_daily_stats
  FOR SELECT TO authenticated
  USING (is_admin());

-- ============================================================
-- FIX 3 (ALTO / LGPD): Adicionar DELETE policies ausentes
-- O direito ao esquecimento (Art. 18 LGPD) exige que usuários
-- possam solicitar exclusão dos próprios dados.
-- ============================================================

-- profiles: usuário pode deletar seu próprio perfil
CREATE POLICY "User can delete own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (id = auth.uid());

-- organizations: apenas admin do sistema pode deletar (proteção contra exclusão acidental)
CREATE POLICY "Admin can delete org"
  ON public.organizations FOR DELETE TO authenticated
  USING (is_admin());

-- support_tickets: usuário pode deletar tickets da própria org
CREATE POLICY "User can delete own tickets"
  ON public.support_tickets FOR DELETE TO authenticated
  USING (org_id = get_user_org_id() AND user_id = auth.uid());

-- support_messages: usuário pode deletar suas próprias mensagens
CREATE POLICY "User can delete own messages"
  ON public.support_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- report_executions: usuário pode deletar execuções da própria org
CREATE POLICY "Users can delete org executions"
  ON public.report_executions FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());
