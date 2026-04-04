-- Add professional_role column to profiles table
-- This column was used in code (Settings, Onboarding, Dashboard) but was never created via migration

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_role TEXT;

COMMENT ON COLUMN public.profiles.professional_role IS 'Cargo ou função profissional do usuário (ex: Engenheiro Civil, Arquiteto)';
