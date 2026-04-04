-- Cria organização para o admin e marca onboarding como completo
DO $$
DECLARE _org_id uuid;
BEGIN
  INSERT INTO public.organizations (name, slug)
  VALUES ('RelatórioFlow Admin', 'relatorioflow-admin')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO _org_id;

  UPDATE public.profiles
    SET org_id = _org_id, onboarding_completed = true
    WHERE id IN (
      SELECT id FROM auth.users WHERE email = 'helvyssxc@gmail.com'
    )
    AND org_id IS NULL;
END $$;
