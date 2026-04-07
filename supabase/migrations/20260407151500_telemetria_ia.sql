-- RelatórioFlow MVP: Telemetria de Custos de IA

create table if not exists public.ai_usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  report_type text, -- tecnico, diario, manutencao
  input_tokens integer default 0,
  output_tokens integer default 0,
  total_tokens integer default 0,
  estimated_cost_usd numeric(12, 10) default 0,
  created_at timestamptz default now()
);

-- RLS
alter table public.ai_usage_logs enable row level security;

-- Policy: Apenas admin pode ver todos os logs
create policy "ai_usage_logs: admin sees all" on public.ai_usage_logs
  for select using (
    exists (select 1 from public.profiles where user_id = auth.uid() and is_admin = true)
  );

-- Função para registrar uso (Pode ser chamada via Edge Function no futuro)
create or replace function public.record_ai_usage(
  p_user_id uuid,
  p_report_type text,
  p_input_tokens integer,
  p_output_tokens integer
) returns void as $$
DECLARE
  v_cost numeric(12, 10);
BEGIN
  -- Estimativa baseada no Gemini 1.5 Flash (Preços em Abril 2024)
  -- Input: $0.075 / 1M tokens ($0.000000075 por token)
  -- Output: $0.30 / 1M tokens ($0.0000003 por token)
  v_cost := (p_input_tokens * 0.000000075) + (p_output_tokens * 0.0000003);
  
  insert into public.ai_usage_logs (user_id, report_type, input_tokens, output_tokens, total_tokens, estimated_cost_usd)
  values (p_user_id, p_report_type, p_input_tokens, p_output_tokens, p_input_tokens + p_output_tokens, v_cost);
END;
$$ language plpgsql security definer;
