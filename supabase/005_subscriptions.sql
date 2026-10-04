-- Six Months of Light: "Get a talk" subscriptions (web push + email). Calendar feeds need no table (choices live in the URL).
-- Personal data kept to the minimum needed to deliver: a push endpoint (or an email address), the chosen options,
-- a time zone and delivery hour. Rows are private (RLS on, no table grants); the site only calls the functions below.
create table if not exists private.push_subs (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique check (endpoint ~ '^https://' and length(endpoint) < 1000),
  p256dh text not null check (length(p256dh) between 40 and 200),
  auth text not null check (length(auth) between 10 and 60),
  prefs jsonb not null default '{}'::jsonb,
  tz text not null default 'America/Denver' check (length(tz) < 64),
  hour int not null default 7 check (hour between 0 and 23),
  created_at timestamptz not null default now(),
  last_sent date,
  fails int not null default 0
);
create table if not exists private.email_subs (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) < 255),
  prefs jsonb not null default '{}'::jsonb,
  tz text not null default 'America/Denver' check (length(tz) < 64),
  hour int not null default 7 check (hour between 0 and 23),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token uuid not null default gen_random_uuid(),
  unsub_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  last_sent date
);
-- Server-only settings (VAPID private key, cron key, email switch). Never exposed to the site.
create table if not exists private.app_config (key text primary key, value text not null);
alter table private.push_subs enable row level security;
alter table private.email_subs enable row level security;
alter table private.app_config enable row level security;
revoke all on private.push_subs, private.email_subs, private.app_config from anon, authenticated;

-- Keep only known option keys, so the prefs column can't be used to store anything else.
create or replace function private.clean_prefs(p jsonb) returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'f', case when p->>'f' = 'weekly' then 'weekly' else 'daily' end,
    'd', least(6, greatest(0, coalesce((p->>'d')::int, 0))),
    'k', left(coalesce(p->>'k', 'talk'), 60), 'lm', left(coalesce(p->>'lm', ''), 40),
    's', case when p->>'s' = 'all' then 'all' else 'oct' end,
    'tp', left(regexp_replace(coalesce(p->>'tp', ''), '[^a-z0-9-]', '', 'g'), 40),
    'sp', left(regexp_replace(coalesce(p->>'sp', ''), '[^a-z0-9-]', '', 'g'), 60)))
$$;

-- Save or update this browser's push subscription (the endpoint itself is the unguessable key).
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_prefs jsonb, p_tz text, p_hour int)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from private.push_subs where created_at > now() - interval '1 minute') > 60 then raise exception 'Too many sign-ups right now; try again in a minute.'; end if;
  insert into private.push_subs (endpoint, p256dh, auth, prefs, tz, hour)
  values (p_endpoint, p_p256dh, p_auth, private.clean_prefs(coalesce(p_prefs, '{}')), coalesce(nullif(p_tz, ''), 'America/Denver'), coalesce(p_hour, 7))
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, prefs = excluded.prefs, tz = excluded.tz, hour = excluded.hour, fails = 0;
  return true;
end $$;
-- One-tap stop: deletes the row entirely.
create or replace function public.push_unsubscribe(p_endpoint text) returns boolean language sql security definer set search_path = '' as $$
  with d as (delete from private.push_subs where endpoint = p_endpoint returning 1) select exists (select 1 from d)
$$;
-- Is this browser subscribed, and with which options? (Only answers for an endpoint you already hold.)
create or replace function public.push_status(p_endpoint text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('prefs', prefs, 'tz', tz, 'hour', hour) from private.push_subs where endpoint = p_endpoint
$$;
revoke all on function public.push_subscribe(text, text, text, jsonb, text, int), public.push_unsubscribe(text), public.push_status(text) from public;
grant execute on function public.push_subscribe(text, text, text, jsonb, text, int), public.push_unsubscribe(text), public.push_status(text) to anon, authenticated;
-- Email sign-up, confirm and unsubscribe go through the "deliver" edge function (it sends the confirmation email),
-- so there are no public email functions here.
