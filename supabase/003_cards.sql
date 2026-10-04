-- Per-card share images: rendered PNGs in a public 'cards' bucket (PNG only, max 2 MB).
-- Uploads go ONLY through the 'card' Edge Function (service role); anon has no storage write policy.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cards', 'cards', true, 2097152, array['image/png'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png'];

create table if not exists private.cards (
  id         text primary key check (id ~ '^[a-z0-9]{10}$'),
  kind       text not null check (kind in ('quote','insight','promo')),
  talk_id    text,
  q          int,
  title      text not null check (char_length(title) <= 300),
  note       text check (char_length(note) <= 90),
  target     text not null check (target like 'https://sixmonthsoflight.com/%'),
  w int, h int,
  ip_hash    text not null,
  deleted    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists cards_ip_idx on private.cards (ip_hash, created_at desc);
create index if not exists cards_created_idx on private.cards (created_at desc);
alter table private.cards enable row level security;

-- called by the Edge Function (service role) only; enforces rate limits
create or replace function public.card_register(p_id text, p_kind text, p_talk text, p_q int, p_title text, p_note text, p_target text, p_w int, p_h int, p_ip text)
returns text language plpgsql security definer set search_path = private, public as $$
begin
  if (select count(*) from private.cards where ip_hash = p_ip and created_at > now() - interval '10 minutes') >= 12
     or (select count(*) from private.cards where ip_hash = p_ip and created_at > now() - interval '1 day') >= 60 then return 'rate'; end if;
  if (select count(*) from private.cards where created_at > now() - interval '1 day') >= 3000 then return 'busy'; end if;
  insert into private.cards (id, kind, talk_id, q, title, note, target, w, h, ip_hash) values (p_id, p_kind, p_talk, p_q, p_title, nullif(p_note,''), p_target, p_w, p_h, p_ip);
  return 'ok';
end $$;

create or replace function public.card_get(p_id text)
returns table (id text, title text, note text, target text, w int, h int) language sql security definer set search_path = private, public as $$
  select c.id, c.title, c.note, c.target, c.w, c.h from private.cards c where c.id = p_id and not c.deleted
$$;

-- admin (password-checked like comments)
create or replace function public.admin_list_cards(p_password text, p_limit int default 60)
returns table (id text, kind text, title text, note text, target text, created_at timestamptz) language plpgsql security definer set search_path = private, public as $$
begin
  if private.check_admin(p_password) is not null then raise exception 'not authorized'; end if;
  return query select c.id, c.kind, c.title, c.note, c.target, c.created_at from private.cards c where not c.deleted order by c.created_at desc limit least(p_limit, 200);
end $$;

create or replace function public.admin_delete_card(p_password text, p_id text)
returns boolean language plpgsql security definer set search_path = private, public as $$
begin
  if private.check_admin(p_password) is not null then return false; end if;
  update private.cards set deleted = true where id = p_id;
  return found;
end $$;

revoke all on function public.card_register(text,text,text,int,text,text,text,int,int,text) from public, anon, authenticated;
revoke all on function public.card_get(text) from public, anon, authenticated;
grant execute on function public.card_register(text,text,text,int,text,text,text,int,int,text) to service_role;
grant execute on function public.card_get(text) to service_role;
revoke all on function public.admin_list_cards(text,int) from public;
revoke all on function public.admin_delete_card(text,text) from public;
grant execute on function public.admin_list_cards(text,int) to anon, authenticated, service_role;
grant execute on function public.admin_delete_card(text,text) to anon, authenticated, service_role;
