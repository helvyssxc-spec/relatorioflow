-- Módulo C: Performance e Escalabilidade (Job Queue)

-- 1. Tabela de Jobs (Fila de Processamento)
create table if not exists public.report_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  report_type text not null,
  payload jsonb not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  result_id uuid, -- ID do relatório gerado (daily_report_id ou technical_report_id)
  error_message text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Habilitar RLS
alter table public.report_jobs enable row level security;
create policy "report_jobs: user sees own" on public.report_jobs
  for select using (auth.uid() = user_id);

-- 2. Índices GIN para busca performática (Módulo C.2)
-- Busca em textos de atividades (daily_reports)
create index if not exists idx_daily_reports_atividades_search on public.daily_reports using gin (atividades);

-- Busca em textos de ocorrências
create index if not exists idx_daily_reports_ocorrencias_search on public.daily_reports using gin (to_tsvector('portuguese', ocorrencias));

-- Busca em relatórios técnicos
create index if not exists idx_technical_reports_diag_search on public.technical_reports using gin (diagnostico);
create index if not exists idx_technical_reports_conclusao_search on public.technical_reports using gin (to_tsvector('portuguese', conclusao));
