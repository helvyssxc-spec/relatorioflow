-- ============================================================
-- Enable RLS on tables that were publicly accessible
-- notifications: user sees only their own
-- organizations: user sees only their own (via profiles.org_id)
-- ============================================================

-- ---- NOTIFICATIONS ----
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "notifications: owner select"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can create notifications for themselves
-- (service role, used by Edge Functions, bypasses RLS automatically)
CREATE POLICY "notifications: owner insert"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "notifications: owner update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications: owner delete"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ---- ORGANIZATIONS ----
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Users can see their own organization only
CREATE POLICY "organizations: member select"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = organizations.id
    )
  );

-- Authenticated users can create an organization (onboarding flow)
CREATE POLICY "organizations: authenticated insert"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own organization
CREATE POLICY "organizations: member update"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = organizations.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.org_id = organizations.id
    )
  );

-- Admin can delete any organization (policy already existed, recreated after RLS enable)
-- The previous policy was created before RLS was enabled, so it had no effect.
-- We drop and recreate to ensure it's active now.
DROP POLICY IF EXISTS "Admin can delete org" ON public.organizations;

CREATE POLICY "organizations: admin delete"
  ON public.organizations FOR DELETE
  USING (is_admin());
