-- Adds optional group links (?g=smith-family). Group posts are still moderated and
-- are shown only on that group's view (unlisted, NOT secret).
alter table private.comments add column if not exists group_tag text check (group_tag is null or group_tag ~ '^[a-z0-9-]{1,40}$');
create index if not exists comments_group_idx on private.comments (group_tag, talk_id, status);

drop view if exists public.approved_comments;
create view public.approved_comments with (security_invoker = false) as
  select id, talk_id, name, body, group_tag, created_at
  from private.comments where status = 'approved';
revoke all on public.approved_comments from public, anon, authenticated;
grant select on public.approved_comments to anon, authenticated;

drop function if exists public.submit_comment(text,text,text,text);
create or replace function public.submit_comment(p_talk_id text, p_name text, p_body text, p_website text default '', p_group text default null)
returns json language plpgsql security definer set search_path = '' as $$
declare v_ip text; v_name text; v_body text; v_group text;
begin
  if coalesce(p_website, '') <> '' then return json_build_object('ok', true); end if;  -- honeypot
  v_name := nullif(left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40), '');
  v_body := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  v_group := nullif(lower(btrim(coalesce(p_group, ''))), '');
  if v_group is not null and v_group !~ '^[a-z0-9-]{1,40}$' then return json_build_object('ok', false, 'error', 'Bad group link.'); end if;
  if char_length(v_body) < 3 then return json_build_object('ok', false, 'error', 'Please write a little more.'); end if;
  if char_length(v_body) > 280 then return json_build_object('ok', false, 'error', 'Please keep it to 280 characters.'); end if;
  if p_talk_id !~ '^[a-z0-9-]{1,60}$' then return json_build_object('ok', false, 'error', 'Unknown talk.'); end if;
  if v_body ~* '(https?://|www\.)' then return json_build_object('ok', false, 'error', 'Links are not allowed.'); end if;
  v_ip := private.client_ip_hash();
  if (select count(*) from private.comments where ip_hash = v_ip and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from private.comments where ip_hash = v_ip and created_at > now() - interval '1 day') >= 15 then
    return json_build_object('ok', false, 'error', 'Thanks! You have shared a lot recently. Please try again later.');
  end if;
  if (select count(*) from private.comments where status = 'pending') >= 300 then
    return json_build_object('ok', false, 'error', 'The queue is full right now. Please try again later.');
  end if;
  insert into private.comments (talk_id, name, body, ip_hash, group_tag) values (p_talk_id, v_name, v_body, v_ip, v_group);
  return json_build_object('ok', true);
end $$;
revoke all on function public.submit_comment(text,text,text,text,text) from public;
grant execute on function public.submit_comment(text,text,text,text,text) to anon, authenticated;

create or replace function public.admin_list_comments(p_password text, p_status text default 'pending')
returns json language plpgsql security definer set search_path = '' as $$
declare v_err text := private.check_admin(p_password);
begin
  if v_err is not null then return json_build_object('ok', false, 'error', v_err); end if;
  return json_build_object('ok', true, 'items', coalesce((
    select json_agg(t) from (
      select c.id, c.talk_id, c.name, c.body, c.status, c.group_tag, c.created_at
      from private.comments c where p_status = 'all' or c.status = p_status
      order by c.created_at desc limit 500) t), '[]'::json));
end $$;
