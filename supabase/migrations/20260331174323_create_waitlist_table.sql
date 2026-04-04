CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON public.waitlist 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist" ON public.waitlist 
  FOR SELECT TO authenticated 
  USING (is_admin());
