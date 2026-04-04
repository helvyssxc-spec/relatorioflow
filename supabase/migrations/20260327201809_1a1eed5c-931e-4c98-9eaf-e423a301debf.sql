
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('report-images', 'report-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload report images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-images');

CREATE POLICY "Anyone can view report images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'report-images');

CREATE POLICY "Users can delete their report images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-images');
