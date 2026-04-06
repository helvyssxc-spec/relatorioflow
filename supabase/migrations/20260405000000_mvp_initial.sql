-- RelatorioFlow MVP: Schema inicial

-- Extensões
create extension if not exists "uuid-ossp";

-- Tabela: profiles (perfil do usuário + controle de acesso)
create table if not exists public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null default '',
  company_name text,
  crea_cau text,
  logo_url text,
  phone text,
  email text not null default '',
  has_access boolean default false not null,
  pagbank_order_id text,
  access_granted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tabela: projects (obras/projetos)
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  address text,
  client_name text,
  art_rrt text,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tabela: daily_reports (Diário de Obra / RDO)
create table if not exists public.daily_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  report_date date not null,
  responsavel text not null default '',
  condicao_tempo text default 'bom',
  temperatura text default '',
  clima_json jsonb default '{}',
  equipe jsonb default '[]',
  atividades jsonb default '[]',
  equipamentos jsonb default '[]',
  ocorrencias text default '',
  fotos jsonb default '[]',
  status text default 'draft' check (status in ('draft', 'finalizado')),
  pdf_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(project_id, report_date)
);

-- Tabela: technical_reports (Relatório Técnico)
create table if not exists public.technical_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  numero_relatorio text not null default '',
  report_date date not null,
  responsavel_tecnico text not null default '',
  crea_cau text default '',
  objetivo text default '',
  metodologia text default '',
  diagnostico jsonb default '[]',
  conclusao text default '',
  recomendacoes jsonb default '[]',
  fotos_gerais jsonb default '[]',
  status text default 'draft' check (status in ('draft', 'finalizado')),
  pdf_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tabela: reports_media (fotos e anexos)
create table if not exists public.reports_media (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  report_type text not null check (report_type in ('daily', 'technical')),
  report_id uuid not null,
  storage_path text not null,
  public_url text not null,
  caption text default '',
  file_type text default 'photo',
  file_size integer default 0,
  created_at timestamptz default now() not null
);

-- Tabela: payment_events (eventos de pagamento PagBank)
create table if not exists public.payment_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  pagbank_order_id text,
  event_type text not null,
  status text,
  amount integer,
  payload jsonb default '{}',
  processed_at timestamptz default now() not null
);

-- RLS: Habilitar em todas as tabelas
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.daily_reports enable row level security;
alter table public.technical_reports enable row level security;
alter table public.reports_media enable row level security;
alter table public.payment_events enable row level security;

-- RLS Policies: profiles
create policy "profiles: user owns own" on public.profiles
  for all using (auth.uid() = user_id);

-- RLS Policies: projects
create policy "projects: user owns own" on public.projects
  for all using (auth.uid() = user_id);

-- RLS Policies: daily_reports
create policy "daily_reports: user owns own" on public.daily_reports
  for all using (auth.uid() = user_id);

-- RLS Policies: technical_reports
create policy "technical_reports: user owns own" on public.technical_reports
  for all using (auth.uid() = user_id);

-- RLS Policies: reports_media
create policy "reports_media: user owns own" on public.reports_media
  for all using (auth.uid() = user_id);

-- RLS Policies: payment_events (somente leitura pelo user)
create policy "payment_events: user reads own" on public.payment_events
  for select using (auth.uid() = user_id);

-- Trigger: criar profile automático no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: updated_at automático
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger daily_reports_updated_at before update on public.daily_reports
  for each row execute procedure public.set_updated_at();
create trigger technical_reports_updated_at before update on public.technical_reports
  for each row execute procedure public.set_updated_at();

-- Storage bucket para fotos
insert into storage.buckets (id, name, public)
values ('reports', 'reports', true)
on conflict (id) do nothing;

create policy "reports storage: user uploads own" on storage.objects
  for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
create policy "reports storage: public read" on storage.objects
  for select using (bucket_id = 'reports');
create policy "reports storage: user deletes own" on storage.objects
  for delete using (auth.uid()::text = (storage.foldername(name))[1]);
