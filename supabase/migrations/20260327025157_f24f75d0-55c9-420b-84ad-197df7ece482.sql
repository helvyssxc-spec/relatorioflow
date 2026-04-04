
-- Create generated_reports table to store report history
CREATE TABLE public.generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_text text NOT NULL,
  client_name text,
  report_content text NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own org reports"
  ON public.generated_reports FOR INSERT TO authenticated
  WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can view own org reports"
  ON public.generated_reports FOR SELECT TO authenticated
  USING (org_id = get_user_org_id());

CREATE POLICY "Users can delete own org reports"
  ON public.generated_reports FOR DELETE TO authenticated
  USING (org_id = get_user_org_id());

-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Users can delete own logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');
