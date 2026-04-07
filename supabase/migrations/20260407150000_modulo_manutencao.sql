-- RelatórioFlow MVP: Módulo de Manutenção
-- Adiciona suporte a Manutenção Preventiva e Corretiva

-- Tabela: maintenance_reports
create table if not exists public.maintenance_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  report_date date not null,
  report_type text not null check (report_type in ('preventiva', 'corretiva')),
  
  -- Dados do Ativo/Sistema
  ativo_nome text not null default '',
  ativo_tag text default '',
  sistema text not null default '', -- ex: Ar Condicionado, Elétrica, Hidráulica
  
  -- Estado do Ativo
  status_anterior text default 'operacional', -- operacional, falha_parcial, parado
  status_posterior text default 'operacional',
  
  -- Detalhes Técnicos
  descricao_servico text default '',
  checklists jsonb default '[]', -- lista de tarefas executadas
  pecas_substituidas jsonb default '[]', -- {nome: string, qtd: number}
  tempo_parada interval,
  
  -- Responsável
  tecnico_nome text not null default '',
  
  -- Mídia e Observações
  observacoes text default '',
  fotos jsonb default '[]',
  
  -- Controle
  status text default 'draft' check (status in ('draft', 'finalizado')),
  pdf_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Habilitar RLS
alter table public.maintenance_reports enable row level security;

-- RLS Policies
create policy "maintenance_reports: user owns own" on public.maintenance_reports
  for all using (auth.uid() = user_id);

-- Trigger: updated_at
create trigger maintenance_reports_updated_at before update on public.maintenance_reports
  for each row execute procedure public.set_updated_at();

-- Atualizar enum de reports_media
alter table public.reports_media drop constraint reports_media_report_type_check;
alter table public.reports_media add constraint reports_media_report_type_check 
  check (report_type in ('daily', 'technical', 'maintenance'));
