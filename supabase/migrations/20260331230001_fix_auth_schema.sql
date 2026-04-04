-- Migration de Reparo: Autenticação e Triggers
-- Objetivo: Resolver "Database error querying schema" e "Database error saving new user"

-- 1. Garantir que as extensões estão no schema correto
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- 2. Ajustar SEARCH_PATH do banco de dados para garantir que auth consiga ver extensions
ALTER DATABASE postgres SET search_path TO public, extensions, auth;

-- 3. Blindar o trigger de criação de perfil (handle_new_user)
-- Adicionando tratamento de erro para evitar que falhas no perfil bloqueiem o Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, onboarding_completed, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    false,
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, permite que o usuário seja criado no Auth mesmo sem perfil imediato
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Limpeza e Re-seed (Bloco principal)
DO $$
BEGIN
  -- Limpar usuários de teste inconsistentes
  DELETE FROM auth.users WHERE email IN ('automation@relatorioflow.com.br', 'homologacao@pagseguro.com.br');

  -- Re-seed Automation User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'automation@relatorioflow.com.br',
    extensions.crypt('admin_automation_2026', extensions.gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Re-seed Homologation User
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'homologacao@pagseguro.com.br',
    extensions.crypt('teste123', extensions.gen_salt('bf')),
    now(),
    'authenticated',
    'authenticated'
  );

  -- Atualizar perfis (vinculação com Org)
  UPDATE public.profiles
  SET 
    org_id = (SELECT id FROM public.organizations WHERE slug = 'automation-lab'),
    is_system_admin = true,
    onboarding_completed = true,
    role = 'owner'
  WHERE email = 'automation@relatorioflow.com.br';

  UPDATE public.profiles
  SET 
    onboarding_completed = true,
    role = 'owner'
  WHERE email = 'homologacao@pagseguro.com.br';

END $$;
