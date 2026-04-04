
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS brand_config jsonb DEFAULT '{}'::jsonb;

INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload org assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org-assets');
CREATE POLICY "Users can view org assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'org-assets');
CREATE POLICY "Users can update org assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'org-assets');
CREATE POLICY "Public can view org assets" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'org-assets');
