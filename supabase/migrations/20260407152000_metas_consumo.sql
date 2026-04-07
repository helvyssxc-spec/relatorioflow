-- RelatórioFlow MVP: Metas de Consumo e Cotas

alter table public.profiles 
add column if not exists ai_token_quota integer default 1000000, -- 1M tokens free tier
add column if not exists storage_quota_mb integer default 1024; -- 1GB free tier Supabase

-- Comentários para documentação
comment on column public.profiles.ai_token_quota is 'Cota mensal de tokens de IA para monitoramento';
comment on column public.profiles.storage_quota_mb is 'Cota de armazenamento em MB para monitoramento';
