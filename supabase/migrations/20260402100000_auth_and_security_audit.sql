-- ============================================================
-- Final Security & Storage Infrastructure Audit
-- RelatórioFlow — 2026-04-02
-- ============================================================

-- 1. Ensure all required storage buckets exist with correct config
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('logos',         'logos',         true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('org-assets',    'org-assets',    true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('report-images', 'report-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Global Storage Read Policy (Public buckets should be readable by anyone)
-- We use a single policy for simplicity on public assets
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('logos', 'org-assets', 'report-images'));

-- 3. Standardized Upload Policies (Tenant Isolation via Path)
-- The first segment of the path MUST be the org_id UUID string.

-- LOGOS
DROP POLICY IF EXISTS "Org users can upload own logos" ON storage.objects;
CREATE POLICY "Org users can upload own logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );

-- ORG-ASSETS (Signatures, etc)
DROP POLICY IF EXISTS "Org users can upload own assets" ON storage.objects;
CREATE POLICY "Org users can upload own assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets' AND
    (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );

-- REPORT-IMAGES
DROP POLICY IF EXISTS "Org users can upload own report images" ON storage.objects;
CREATE POLICY "Org users can upload own report images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-images' AND
    (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );

-- 4. Standardized Delete Policies
DROP POLICY IF EXISTS "Users can delete own org objects" ON storage.objects;
CREATE POLICY "Users can delete own org objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('logos', 'org-assets', 'report-images') AND
    (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );

-- 5. Fix potential recursion in is_admin for audit_logs
-- Ensure the function is as fast as possible.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Cache-friendly check for system admin
  SELECT is_system_admin FROM public.profiles WHERE id = auth.uid();
$$;

-- 6. Add "Internal Support" Admin view for Organizations
-- Permits platform admins to see all orgs for support purposes.
DROP POLICY IF EXISTS "Admins can view all orgs" ON public.organizations;
CREATE POLICY "Admins can view all orgs"
  ON public.organizations FOR SELECT TO authenticated
  USING (is_admin());
