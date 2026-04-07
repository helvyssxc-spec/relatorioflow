-- Módulo B: Segurança e Conformidade

-- 1. Criação do bucket 'report-images' se não existir
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', false)
on conflict (id) do nothing;

-- 2. Tabela de Auditoria Avançada
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.profiles(user_id) on delete set null, -- No MVP, org_id é o user_id por enquanto
  user_id uuid references auth.users(id) on delete cascade,
  action text not null, -- Ex: 'report.generated', 'photo.uploaded'
  metadata jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz default now() not null
);

-- Habilitar RLS nos logs
alter table public.audit_logs enable row level security;
create policy "audit_logs: users view own" on public.audit_logs
  for select using (auth.uid() = user_id);

-- 3. Políticas de RLS para o bucket 'report-images'
-- Isolamento por pasta: {user_id}/{report_type}/{report_id}/{filename}
create policy "report-images: isolated upload" on storage.objects
  for insert with check (
    bucket_id = 'report-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "report-images: isolated read" on storage.objects
  for select using (
    bucket_id = 'report-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "report-images: isolated delete" on storage.objects
  for delete using (
    bucket_id = 'report-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
