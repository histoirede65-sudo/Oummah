-- OUMMAH — annonces et événements des mosquées.
--
-- Comme les horaires : n'importe quel utilisateur connecté propose, un administrateur valide.
--   announcement : message (fermeture travaux, collecte, cours…), affiché jusqu'à ends_at, sinon 30 jours.
--   event        : rendez-vous daté (conférence, iftar, cours…), affiché jusqu'à sa fin.

create table if not exists public.mosque_posts (
  id uuid primary key default gen_random_uuid(),
  mosque_id text not null check (length(mosque_id) between 1 and 200),
  mosque_name text not null check (length(mosque_name) between 1 and 200),
  kind text not null check (kind in ('announcement', 'event')),
  title text not null check (length(trim(title)) between 3 and 120),
  body text check (body is null or length(body) <= 1000),
  starts_at timestamptz,
  ends_at timestamptz,
  submitted_by uuid default auth.uid() references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mosque_posts_event_dates check (kind <> 'event' or starts_at is not null),
  constraint mosque_posts_dates_order check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create index if not exists mosque_posts_mosque_status_idx on public.mosque_posts (mosque_id, status);
create index if not exists mosque_posts_pending_idx on public.mosque_posts (created_at desc) where status = 'pending';

alter table public.mosque_posts enable row level security;
drop policy if exists "Read approved or own mosque posts" on public.mosque_posts;
create policy "Read approved or own mosque posts" on public.mosque_posts for select to anon, authenticated
  using (status = 'approved' or submitted_by = auth.uid() or public.is_oummah_admin());
drop policy if exists "Authenticated proposes mosque posts" on public.mosque_posts;
create policy "Authenticated proposes mosque posts" on public.mosque_posts for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending' and reviewed_by is null and reviewed_at is null);
grant select on public.mosque_posts to anon, authenticated;
grant insert on public.mosque_posts to authenticated;

-- Limite anti-abus : 5 propositions par personne et par 24 h.
create or replace function public.limit_mosque_posts()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from public.mosque_posts
      where submitted_by = new.submitted_by and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'MOSQUE_POST_LIMIT';
  end if;
  return new;
end;
$$;
drop trigger if exists limit_mosque_posts_trigger on public.mosque_posts;
create trigger limit_mosque_posts_trigger before insert on public.mosque_posts
for each row execute function public.limit_mosque_posts();

-- Annonces et événements visibles d'une mosquée (toutes ses sources).
create or replace function public.get_mosque_posts(p_mosque_id text)
returns table (
  id uuid, kind text, title text, body text, starts_at timestamptz, ends_at timestamptz, published_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.kind, p.title, p.body, p.starts_at, p.ends_at, coalesce(p.reviewed_at, p.created_at)
  from public.mosque_posts p
  where p.mosque_id = any(public.mosque_related_ids(p_mosque_id))
    and p.status = 'approved'
    and case
      when p.kind = 'event' then coalesce(p.ends_at, p.starts_at + interval '3 hours') > now()
      else coalesce(p.ends_at, coalesce(p.reviewed_at, p.created_at) + interval '30 days') > now()
    end
  order by case when p.kind = 'event' then p.starts_at else coalesce(p.reviewed_at, p.created_at) end
  limit 20;
$$;
grant execute on function public.get_mosque_posts(text) to anon, authenticated;

create or replace function public.admin_list_mosque_posts(p_status text default 'pending')
returns setof public.mosque_posts
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  return query select * from public.mosque_posts
    where p_status is null or status = p_status
    order by created_at desc;
end;
$$;
grant execute on function public.admin_list_mosque_posts(text) to authenticated;

create or replace function public.admin_review_mosque_post(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  update public.mosque_posts
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    where id = p_id;
end;
$$;
grant execute on function public.admin_review_mosque_post(uuid, boolean) to authenticated;

-- Alerte aux administrateurs, comme pour les horaires.
create or replace function public.notify_admins_new_mosque_post()
returns trigger language plpgsql security definer set search_path = public, auth, net
as $$
begin
  if new.status = 'pending' then
    perform public.create_admin_alert_and_notify(
      'mosque_post_pending', 'mosque-post:' || new.id::text, 'warning',
      case when new.kind = 'event' then 'Événement de mosquée à valider' else 'Annonce de mosquée à valider' end,
      new.mosque_name || ' : ' || new.title, true,
      jsonb_build_object('post_id', new.id, 'mosque_id', new.mosque_id, 'mosque_name', new.mosque_name)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists notify_admins_new_mosque_post_trigger on public.mosque_posts;
create trigger notify_admins_new_mosque_post_trigger after insert on public.mosque_posts
for each row execute function public.notify_admins_new_mosque_post();

notify pgrst, 'reload schema';
