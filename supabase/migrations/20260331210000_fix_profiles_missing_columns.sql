-- ============================================================
-- HOTFIX: Adiciona colunas ausentes na tabela profiles
-- O projeto foi iniciado com o template padrão do Supabase que
-- criou a tabela profiles sem as colunas necessárias pelo app.
-- ============================================================

-- 1. Adiciona colunas ausentes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Popula email a partir de auth.users
UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
    AND p.email IS NULL;

-- 3. Marca o admin como is_system_admin
UPDATE public.profiles
  SET is_system_admin = true
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'helvyssxc@gmail.com'
  );

-- 4. Garante que o admin tem perfil (cria se não existir)
INSERT INTO public.profiles (id, full_name, email, role, is_system_admin)
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Admin'),
    u.email,
    'owner',
    true
  FROM auth.users u
  WHERE u.email = 'helvyssxc@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id)
  ON CONFLICT (id) DO UPDATE SET is_system_admin = true;

-- 5. Cria organização para o usuário de homologação do PagBank (se não tiver)
DO $$
DECLARE
  _homolog_id uuid;
  _org_id uuid;
BEGIN
  SELECT id INTO _homolog_id FROM auth.users WHERE email = 'homologacao@pagseguro.com.br';

  IF _homolog_id IS NOT NULL THEN
    -- Cria org se o perfil não tiver org_id
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _homolog_id AND org_id IS NOT NULL) THEN
      INSERT INTO public.organizations (name, slug)
      VALUES ('PagBank Homologação', 'pagbank-homologacao')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO _org_id;

      UPDATE public.profiles
        SET org_id = _org_id, role = 'owner', onboarding_completed = true
        WHERE id = _homolog_id;
    END IF;
  END IF;
END $$;
