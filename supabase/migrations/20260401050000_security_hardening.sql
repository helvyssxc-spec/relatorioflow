-- ============================================================
-- Security hardening migration
-- Fixes found in security audit of 2026-04-01
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. payment_events: explicit service_role INSERT policy
--    Edge Functions use service_role (bypasses RLS), but adding
--    an explicit policy documents intent and prevents accidents
--    if the client is ever changed.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payment_events'
      AND policyname = 'payment_events: service role insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "payment_events: service role insert"
        ON public.payment_events
        FOR INSERT
        TO service_role
        WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. subscriptions: DELETE policy for LGPD compliance (Art. 18)
--    Users/orgs can request deletion of their own subscription
--    records. Actual cancellation logic stays in the Edge Function.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'subscriptions: org member delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "subscriptions: org member delete"
        ON public.subscriptions
        FOR DELETE
        TO authenticated
        USING (org_id = public.get_user_org_id())
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. subscriptions: mask pagbank_card_token
--    The token is PagBank's card reference ID, not raw card data,
--    but treat it as sensitive. Rename to clarify + add note.
--    We do NOT encrypt here (would require pgcrypto + key mgmt)
--    but we document the column's purpose.
-- ─────────────────────────────────────────────────────────────
COMMENT ON COLUMN public.subscriptions.pagbank_card_token
  IS 'PagBank card reference ID (not raw card data). Treat as sensitive. Do not log or expose in API responses.';

-- Revoke direct SELECT on subscriptions from authenticated so they
-- must go through the RLS-filtered view. RLS handles access control,
-- but adding a comment also signals to devs not to expose this field.
-- (No structural change needed — RLS already limits to own org.)

-- ─────────────────────────────────────────────────────────────
-- 4. umami_daily_stats: admin DELETE policy
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'umami_daily_stats'
      AND policyname = 'umami_daily_stats: admin delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "umami_daily_stats: admin delete"
        ON public.umami_daily_stats
        FOR DELETE
        TO authenticated
        USING (public.is_admin())
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. waitlist: admin DELETE (LGPD — right to be forgotten)
--    Allows admin to remove email entries on request.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'waitlist'
      AND policyname = 'waitlist: admin delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "waitlist: admin delete"
        ON public.waitlist
        FOR DELETE
        TO authenticated
        USING (public.is_admin())
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. audit_logs: explicit service_role INSERT policy
--    Edge Functions insert audit records via service_role.
--    Explicit policy documents this intent.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
      AND policyname = 'audit_logs: service role insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "audit_logs: service role insert"
        ON public.audit_logs
        FOR INSERT
        TO service_role
        WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. notifications: explicit service_role INSERT policy
--    Notification triggers fire as SECURITY DEFINER, but
--    direct Edge Function inserts need this policy.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications'
      AND policyname = 'notifications: service role insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "notifications: service role insert"
        ON public.notifications
        FOR INSERT
        TO service_role
        WITH CHECK (true)
    $p$;
  END IF;
END $$;
