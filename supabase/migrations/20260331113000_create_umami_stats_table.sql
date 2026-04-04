-- Tabela para armazenar estatísticas diárias condensadas do Umami
create table public.umami_daily_stats (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    website_id uuid not null,
    pageviews bigint not null default 0,
    visitors bigint not null default 0,
    visits bigint not null default 0,
    bounces bigint not null default 0,
    totaltime bigint not null default 0,
    created_at timestamp with time zone not null default now(),
    
    constraint umami_daily_stats_date_website_key unique (date, website_id)
);

-- Ativar RLS
alter table public.umami_daily_stats enable row level security;

-- Permitir leitura para usuários autenticados (ou remova caso queira que só você acesse via banco)
create policy "Permitir leitura para usuários autenticados" 
    on public.umami_daily_stats 
    for select 
    to authenticated 
    using (true);

-- Apenas o Service Role (que executa as Edge Functions) pode inserir e atualizar
create policy "Permitir full access para acesso privilegiado (service_role)"
    on public.umami_daily_stats
    for all
    to service_role
    using (true)
    with check (true);
