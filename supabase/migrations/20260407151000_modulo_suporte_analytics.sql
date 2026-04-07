-- RelatórioFlow MVP: Módulo de Suporte e Chamados

-- Tabela: tickets
create table if not exists public.tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null, -- Null se for ticket via landing sem login
  email text not null, -- Email de quem abriu o chamado
  subject text not null,
  description text not null,
  status text default 'aberto' check (status in ('aberto', 'em_analise', 'resolvido', 'fechado')),
  priority text default 'media' check (priority in ('baixa', 'media', 'alta', 'critica')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Adicionar campo de Analytics no Profile Admin (Opcional, ou criar tabela Config)
-- Para o MVP, vamos adicionar na tabela profiles campos de scripts
alter table public.profiles add column if not exists analytics_umami_id text;
alter table public.profiles add column if not exists analytics_ga_id text;
alter table public.profiles add column if not exists is_admin boolean default false;

-- Habilitar RLS
alter table public.tickets enable row level security;

-- RLS Policies: tickets
create policy "tickets: user can insert own or public" on public.tickets
  for insert with check (true); -- Permitir abertura pública
create policy "tickets: user can see own" on public.tickets
  for select using (auth.uid() = user_id or email = (select email from auth.users where id = auth.uid()));
create policy "tickets: admin sees all" on public.tickets
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );

-- Trigger: updated_at
create trigger tickets_updated_at before update on public.tickets
  for each row execute procedure public.set_updated_at();
