CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed automation test user for E2E sweeps
-- This user is specifically for Playwriter/MCP automation and is marked as system admin for full accessibility.

DO $$
BEGIN
  -- 1. Create Organization
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'automation-lab') THEN
    INSERT INTO public.organizations (name, slug, plan, plan_status)
    VALUES ('Automation Lab', 'automation-lab', 'business', 'active');
  END IF;

  -- 2. Create User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'automation@relatorioflow.com.br') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
    VALUES (
      gen_random_uuid(),
      'automation@relatorioflow.com.br',
      extensions.crypt('admin_automation_2026', extensions.gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 3. Update Profile
  UPDATE public.profiles
  SET 
    org_id = (SELECT id FROM public.organizations WHERE slug = 'automation-lab'),
    is_system_admin = true,
    onboarding_completed = true,
    role = 'owner'
  WHERE email = 'automation@relatorioflow.com.br';

END $$;
