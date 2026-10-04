-- Six Months of Light: run "Get a talk" deliveries every 15 minutes (pg_cron + pg_net -> deliver edge function).
-- The function checks each subscriber's own time zone and hour, and sends at most one item per day.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create or replace function private.run_deliveries() returns bigint language sql security definer set search_path = '' as $$
  select net.http_post(
    url := 'https://yrofrjdmhnudqbuvukqm.supabase.co/functions/v1/deliver',
    headers := jsonb_build_object('content-type', 'application/json', 'x-cron-key', (select value from private.app_config where key = 'cron_key')),
    body := '{}'::jsonb, timeout_milliseconds := 60000)
$$;
revoke all on function private.run_deliveries() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'sml-deliveries';
select cron.schedule('sml-deliveries', '*/15 * * * *', 'select private.run_deliveries()');
-- One-time server settings (made in SQL, never in the repo):
--   insert into private.app_config(key,value) values ('cron_key', encode(extensions.gen_random_bytes(32),'hex')), ('email_enabled','false'), ('vapid_subject','https://sixmonthsoflight.com/');
--   The VAPID key pair is created by the deliver function on first use and kept in private.app_config.
