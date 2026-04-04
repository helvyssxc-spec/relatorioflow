-- Fix storage buckets: ensure file_size_limit and allowed_mime_types are set.
-- Earlier migrations created the buckets without these constraints,
-- which could cause upload failures when the client sends them.

UPDATE storage.buckets
SET
  file_size_limit  = 5242880,  -- 5 MB
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
WHERE id IN ('org-assets', 'logos');

UPDATE storage.buckets
SET
  file_size_limit  = 10485760, -- 10 MB
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'report-images';

-- Ensure report-images bucket exists (created in later migration; safe to re-insert)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-images', 'report-images', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;
