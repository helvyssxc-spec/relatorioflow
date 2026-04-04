
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES public.profiles(id),
  name        text NOT NULL DEFAULT 'Chave principal',
  key_hash    text NOT NULL UNIQUE,
  key_preview text NOT NULL,
  is_active   boolean DEFAULT true,
  last_used   timestamptz,
  created_at  timestamptz DEFAULT now(),
  revoked_at  timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org sees own keys"
  ON public.api_keys FOR ALL
  USING (org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash) WHERE is_active = true;
