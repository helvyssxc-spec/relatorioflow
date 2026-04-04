-- ============================================================
-- Helper Functions Migration
-- RelatórioFlow — 2026-03-30
-- These functions are required by RLS policies across all tables
-- ============================================================

-- get_user_org_id(): Returns the org_id of the currently authenticated user
-- STABLE so PostgreSQL can cache the result within a transaction
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- is_admin(): Returns true if the current user has the admin email
-- Used by admin-level RLS policies
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
    AND email = 'helvyssxc@gmail.com'
  );
$$;
