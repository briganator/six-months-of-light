-- "Heard it live": lines people heard during a live session. Moderated before anything is public.
-- Anon can ONLY submit via public.submit_live_quote() and read approved rows via public.approved_live_quotes.
create table if not exists private.live_quotes (
  id          bigint generated always as identity primary key,
  conf        text        not null default '2026-10' check (conf ~ '^[0-9]{4}-[0-9]{2}$'),
  session_id  text        not null check (session_id ~ '^[a-z-]{2,20}$'),
  talk_id     text        check (talk_id is null or talk_id ~ '^[a-z0-9-]{1,60}$'),
  speaker     text        not null check (char_length(speaker) between 2 and 60),
  body        text        not null check (char_length(body) between 8 and 220),
  status      text        not null default 'pending' check (status in ('pending','approved','hidden')),
  ip_hash     text,
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists live_quotes_status_idx on private.live_quotes (status, created_at desc);
create index if not exists live_quotes_ip_idx on private.live_quotes (ip_hash, created_at desc);
alter table private.live_quotes enable row level security;

create or replace view public.approved_live_quotes with (security_invoker = false) as
  select id, conf, session_id, talk_id, speaker, body, created_at from private.live_quotes where status = 'approved';
revoke all on public.approved_live_quotes from public, anon, authenticated;
grant select on public.approved_live_quotes to anon, authenticated;

create or replace function public.submit_live_quote(p_session text, p_talk_id text, p_speaker text, p_body text, p_website text default '')
returns json language plpgsql security definer set search_path = '' as $$
declare v_ip text; v_sp text; v_body text;
begin
  if coalesce(p_website, '') <> '' then return json_build_object('ok', true); end if;
  v_sp := btrim(regexp_replace(coalesce(p_speaker, ''), '\s+', ' ', 'g'));
  v_body := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  if char_length(v_sp) < 2 or char_length(v_sp) > 60 then return json_build_object('ok', false, 'error', 'Please choose who said it.'); end if;
  if char_length(v_body) < 8 then return json_build_object('ok', false, 'error', 'Please write a little more.'); end if;
  if char_length(v_body) > 220 then return json_build_object('ok', false, 'error', 'Please keep it to 220 characters.'); end if;
  if coalesce(p_session, '') !~ '^[a-z-]{2,20}$' then return json_build_object('ok', false, 'error', 'Unknown session.'); end if;
  if p_talk_id is not null and p_talk_id !~ '^[a-z0-9-]{1,60}$' then p_talk_id := null; end if;
  if (v_body || ' ' || v_sp) ~* '(https?://|www\.|\.com\b)' then return json_build_object('ok', false, 'error', 'Links are not allowed.'); end if;
  if (v_body || ' ' || v_sp) ~* '\m(fuck\w*|shit\w*|bitch\w*|cunt\w*|dick|pussy|asshole\w*|bastard\w*|damn\w*|whore\w*|slut\w*|nigg\w*|fag\w*|retard\w*)\M' then
    return json_build_object('ok', false, 'error', 'Please keep it clean.'); end if;
  v_ip := private.client_ip_hash();
  if (select count(*) from private.live_quotes where ip_hash = v_ip and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from private.live_quotes where ip_hash = v_ip and created_at > now() - interval '1 day') >= 12 then
    return json_build_object('ok', false, 'error', 'Thanks! You have shared a lot recently. Please try again later.'); end if;
  if (select count(*) from private.live_quotes where status = 'pending') >= 500 then
    return json_build_object('ok', false, 'error', 'The wall queue is full right now. Your card still works.'); end if;
  insert into private.live_quotes (session_id, talk_id, speaker, body, ip_hash) values (p_session, p_talk_id, v_sp, v_body, v_ip);
  return json_build_object('ok', true);
end $$;

create or replace function public.admin_list_live(p_password text, p_status text default 'pending')
returns json language plpgsql security definer set search_path = '' as $$
declare v_err text := private.check_admin(p_password);
begin
  if v_err is not null then return json_build_object('ok', false, 'error', v_err); end if;
  return json_build_object('ok', true, 'items', coalesce((select json_agg(t) from (
    select q.id, q.session_id, q.talk_id, q.speaker, q.body, q.status, q.created_at from private.live_quotes q
    where p_status = 'all' or q.status = p_status order by q.created_at desc limit 500) t), '[]'::json));
end $$;

create or replace function public.admin_set_live_status(p_password text, p_id bigint, p_status text)
returns json language plpgsql security definer set search_path = '' as $$
declare v_err text := private.check_admin(p_password);
begin
  if v_err is not null then return json_build_object('ok', false, 'error', v_err); end if;
  if p_status not in ('pending','approved','hidden') then return json_build_object('ok', false, 'error', 'Bad status'); end if;
  update private.live_quotes set status = p_status, reviewed_at = now() where id = p_id;
  return json_build_object('ok', found);
end $$;

revoke all on function public.submit_live_quote(text,text,text,text,text) from public;
revoke all on function public.admin_list_live(text,text) from public;
revoke all on function public.admin_set_live_status(text,bigint,text) from public;
grant execute on function public.submit_live_quote(text,text,text,text,text) to anon, authenticated;
grant execute on function public.admin_list_live(text,text) to anon, authenticated;
grant execute on function public.admin_set_live_status(text,bigint,text) to anon, authenticated;
