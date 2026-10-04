-- Conference Share: "What stuck with me" comments with moderation.
-- Public (anon) clients can ONLY: read approved comments via public.approved_comments,
-- and submit via public.submit_comment(). Everything else goes through
-- password-checked SECURITY DEFINER admin functions. Tables are not exposed.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.comments (
  id          bigint generated always as identity primary key,
  talk_id     text        not null check (talk_id ~ '^[a-z0-9-]{1,60}$'),
  name        text        check (name is null or char_length(name) <= 40),
  body        text        not null check (char_length(body) between 3 and 280),
  status      text        not null default 'pending' check (status in ('pending','approved','hidden')),
  ip_hash     text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists comments_talk_status_idx on private.comments (talk_id, status, created_at desc);
create index if not exists comments_ip_idx on private.comments (ip_hash, created_at desc);

create table if not exists private.settings (
  key   text primary key,
  value text not null
);

create table if not exists private.admin_attempts (
  id bigint generated always as identity primary key,
  ip_hash text,
  ok boolean not null,
  created_at timestamptz not null default now()
);

alter table private.comments enable row level security;
alter table private.settings enable row level security;
alter table private.admin_attempts enable row level security;

-- Helper: hashed client IP (from PostgREST request headers). Never stores raw IP.
create or replace function private.client_ip_hash() returns text
language plpgsql stable security definer set search_path = '' as $$
declare h json; ip text;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then h := null; end;
  ip := coalesce(split_part(h->>'x-forwarded-for', ',', 1), h->>'x-real-ip', 'unknown');
  return encode(extensions.digest(trim(ip) || ':conference-share', 'sha256'), 'hex');
end $$;

-- Public read: approved comments only, no ip_hash/status.
create or replace view public.approved_comments with (security_invoker = false) as
  select id, talk_id, name, body, created_at
  from private.comments
  where status = 'approved';
revoke all on public.approved_comments from public, anon, authenticated;
grant select on public.approved_comments to anon, authenticated;

-- Public submit with honeypot, length caps, and rate limits.
create or replace function public.submit_comment(p_talk_id text, p_name text, p_body text, p_website text default '')
returns json language plpgsql security definer set search_path = '' as $$
declare v_ip text; v_name text; v_body text;
begin
  -- Honeypot: bots fill hidden "website" field. Pretend success, store nothing.
  if coalesce(p_website, '') <> '' then
    return json_build_object('ok', true);
  end if;
  v_name := nullif(left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40), '');
  v_body := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  if char_length(v_body) < 3 then
    return json_build_object('ok', false, 'error', 'Please write a little more.');
  end if;
  if char_length(v_body) > 280 then
    return json_build_object('ok', false, 'error', 'Please keep it to 280 characters.');
  end if;
  if p_talk_id !~ '^[a-z0-9-]{1,60}$' then
    return json_build_object('ok', false, 'error', 'Unknown talk.');
  end if;
  if v_body ~* '(https?://|www\.)' then
    return json_build_object('ok', false, 'error', 'Links are not allowed.');
  end if;
  v_ip := private.client_ip_hash();
  -- Per-person: 3 per 10 minutes, 15 per day.
  if (select count(*) from private.comments where ip_hash = v_ip and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from private.comments where ip_hash = v_ip and created_at > now() - interval '1 day') >= 15 then
    return json_build_object('ok', false, 'error', 'Thanks! You have shared a lot recently. Please try again later.');
  end if;
  -- Global safety valve: 300 pending items max.
  if (select count(*) from private.comments where status = 'pending') >= 300 then
    return json_build_object('ok', false, 'error', 'The queue is full right now. Please try again later.');
  end if;
  insert into private.comments (talk_id, name, body, ip_hash) values (p_talk_id, v_name, v_body, v_ip);
  return json_build_object('ok', true);
end $$;

-- Admin password check with brute-force throttle (10 failures / 15 min per IP).
-- Returns NULL when OK, else an error message. (Doesn't raise, so failed attempts are recorded.)
create or replace function private.check_admin(p_password text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare v_ip text := private.client_ip_hash(); v_hash text; v_ok boolean;
begin
  if (select count(*) from private.admin_attempts where ip_hash = v_ip and not ok and created_at > now() - interval '15 minutes') >= 10 then
    return 'Too many attempts. Please wait 15 minutes.';
  end if;
  select value into v_hash from private.settings where key = 'admin_password_hash';
  v_ok := v_hash is not null and extensions.crypt(coalesce(p_password, ''), v_hash) = v_hash;
  insert into private.admin_attempts (ip_hash, ok) values (v_ip, v_ok);
  delete from private.admin_attempts where created_at < now() - interval '1 day';
  if not v_ok then return 'Wrong password.'; end if;
  return null;
end $$;

create or replace function public.admin_list_comments(p_password text, p_status text default 'pending')
returns json language plpgsql security definer set search_path = '' as $$
declare v_err text := private.check_admin(p_password);
begin
  if v_err is not null then return json_build_object('ok', false, 'error', v_err); end if;
  return json_build_object('ok', true, 'items', coalesce((
    select json_agg(t) from (
      select c.id, c.talk_id, c.name, c.body, c.status, c.created_at
      from private.comments c
      where p_status = 'all' or c.status = p_status
      order by c.created_at desc
      limit 500) t), '[]'::json));
end $$;

create or replace function public.admin_set_status(p_password text, p_id bigint, p_status text)
returns json language plpgsql security definer set search_path = '' as $$
declare v_err text := private.check_admin(p_password);
begin
  if v_err is not null then return json_build_object('ok', false, 'error', v_err); end if;
  if p_status not in ('pending','approved','hidden') then
    return json_build_object('ok', false, 'error', 'Bad status');
  end if;
  update private.comments set status = p_status, reviewed_at = now() where id = p_id;
  return json_build_object('ok', found);
end $$;

revoke all on function public.submit_comment(text,text,text,text) from public;
revoke all on function public.admin_list_comments(text,text) from public;
revoke all on function public.admin_set_status(text,bigint,text) from public;
grant execute on function public.submit_comment(text,text,text,text) to anon, authenticated;
grant execute on function public.admin_list_comments(text,text) to anon, authenticated;
grant execute on function public.admin_set_status(text,bigint,text) to anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

-- Set / change the admin password (run in Supabase SQL editor; never commit the password):
--   insert into private.settings (key, value)
--   values ('admin_password_hash', extensions.crypt('YOUR-NEW-PASSWORD', extensions.gen_salt('bf')))
--   on conflict (key) do update set value = excluded.value;
