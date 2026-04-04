-- Habilitando extensões necessárias caso não estejam (necessita de permissão)
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Agendamento da rotina para 23:55 todos os dias
-- Chama a função via HTTP POST (internamente no Supabase)
select cron.schedule(
  'backup-umami-diario',
  '55 23 * * *',
  $$
    select net.http_post(
      url:='https://lmydxgmiytiwgfmjjxdb.supabase.co/functions/v1/sync-umami-stats',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    )
  $$
);
