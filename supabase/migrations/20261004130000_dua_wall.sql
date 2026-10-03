-- OUMMAH — Mur des duas.
--
-- * Publication par un membre ayant un profil OUMMAH ; anonyme par défaut.
-- * Une doua est validée par un administrateur avant d'être visible (peu d'utilisateurs : modération a priori).
-- * « Amine » (une fois par membre) et compteur ; aucun like, aucun abonné, aucun classement.
-- * Réponses bienveillantes visibles tout de suite, filtrées, masquées après 3 signalements.
-- * Signalement, suppression de ses propres publications, « Allah m'a exaucé » + gratitude facultative.

create table if not exists public.dua_wall_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) between 10 and 600),
  anonymous boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed')),
  answered boolean not null default false,
  gratitude text check (gratitude is null or length(gratitude) <= 600),
  answered_at timestamptz,
  ameen_count integer not null default 0,
  reply_count integer not null default 0,
  report_count integer not null default 0,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dua_wall_posts_feed_idx on public.dua_wall_posts (status, created_at desc);
create index if not exists dua_wall_posts_user_idx on public.dua_wall_posts (user_id);

create table if not exists public.dua_wall_ameens (
  post_id uuid not null references public.dua_wall_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.dua_wall_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.dua_wall_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) between 2 and 300),
  hidden boolean not null default false,
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists dua_wall_replies_post_idx on public.dua_wall_replies (post_id, created_at);

create table if not exists public.dua_wall_reports (
  target_type text not null check (target_type in ('post', 'reply')),
  target_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text check (reason is null or length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (target_type, target_id, user_id)
);

-- Everything goes through the functions below.
alter table public.dua_wall_posts enable row level security;
alter table public.dua_wall_ameens enable row level security;
alter table public.dua_wall_replies enable row level security;
alter table public.dua_wall_reports enable row level security;
revoke all on public.dua_wall_posts, public.dua_wall_ameens, public.dua_wall_replies, public.dua_wall_reports from anon, authenticated;

-- Words never accepted (insults, curses). Short list, completed by reports and moderation.
create or replace function public.dua_wall_text_allowed(p_text text)
returns boolean language sql immutable as $$
  select not (lower(p_text) ~ '(\m(connard|connasse|salope|pute|putain|encul|batard|bâtard|nique|niquer|fdp|ntm|pd|tg|ta gueule|fuck|bitch|shit|asshole|kafir de merde)\M)');
$$;

create or replace function public.dua_wall_require_profile()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.community_profiles where user_id = auth.uid()) then raise exception 'PROFILE_REQUIRED'; end if;
end;
$$;

-- ----- Feed --------------------------------------------------------------------------------------

create or replace function public.dua_wall_feed(p_filter text default 'recent', p_before timestamptz default null, p_limit integer default 20)
returns table (
  id uuid, body text, author text, author_avatar text, answered boolean, gratitude text,
  ameen_count integer, reply_count integer, my_ameen boolean, mine boolean, status text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.body,
         case when p.anonymous then null else c.pseudo end,
         case when p.anonymous then null else c.avatar end,
         p.answered, p.gratitude, p.ameen_count, p.reply_count,
         exists (select 1 from public.dua_wall_ameens a where a.post_id = p.id and a.user_id = auth.uid()),
         p.user_id = auth.uid(), p.status, p.created_at
  from public.dua_wall_posts p
  left join public.community_profiles c on c.user_id = p.user_id
  where (
      (p.status = 'approved' and p.report_count < 3)
      -- The author also sees their own posts waiting for validation.
      or (p.user_id = auth.uid() and p.status = 'pending')
    )
    and (p_filter <> 'answered' or p.answered)
    and (p_filter <> 'mine' or p.user_id = auth.uid())
    and (p_before is null or p.created_at < p_before)
  order by case when p.user_id = auth.uid() and p.status = 'pending' then 0 else 1 end, p.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;
grant execute on function public.dua_wall_feed(text, timestamptz, integer) to anon, authenticated;

create or replace function public.dua_wall_replies_of(p_post uuid)
returns table (id uuid, body text, author text, author_avatar text, mine boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.body, c.pseudo, c.avatar, r.user_id = auth.uid(), r.created_at
  from public.dua_wall_replies r
  join public.dua_wall_posts p on p.id = r.post_id and p.status = 'approved'
  left join public.community_profiles c on c.user_id = r.user_id
  where r.post_id = p_post and not r.hidden and r.report_count < 3
  order by r.created_at
  limit 100;
$$;
grant execute on function public.dua_wall_replies_of(uuid) to anon, authenticated;

-- ----- Actions -----------------------------------------------------------------------------------

create or replace function public.dua_wall_publish(p_body text, p_anonymous boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public.dua_wall_require_profile();
  if not public.dua_wall_text_allowed(p_body) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.dua_wall_posts where user_id = auth.uid() and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.dua_wall_posts (user_id, body, anonymous) values (auth.uid(), trim(p_body), coalesce(p_anonymous, true))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.dua_wall_publish(text, boolean) to authenticated;

create or replace function public.dua_wall_ameen(p_post uuid, p_on boolean)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  perform public.dua_wall_require_profile();
  if not exists (select 1 from public.dua_wall_posts where id = p_post and status = 'approved') then raise exception 'NOT_FOUND'; end if;
  if p_on then
    insert into public.dua_wall_ameens (post_id, user_id) values (p_post, auth.uid()) on conflict do nothing;
  else
    delete from public.dua_wall_ameens where post_id = p_post and user_id = auth.uid();
  end if;
  update public.dua_wall_posts set ameen_count = (select count(*) from public.dua_wall_ameens where post_id = p_post)
    where id = p_post returning ameen_count into v_count;
  return v_count;
end;
$$;
grant execute on function public.dua_wall_ameen(uuid, boolean) to authenticated;

create or replace function public.dua_wall_reply(p_post uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public.dua_wall_require_profile();
  if not exists (select 1 from public.dua_wall_posts where id = p_post and status = 'approved') then raise exception 'NOT_FOUND'; end if;
  if not public.dua_wall_text_allowed(p_body) then raise exception 'TEXT_REFUSED'; end if;
  if (select count(*) from public.dua_wall_replies where user_id = auth.uid() and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'RATE_LIMIT';
  end if;
  insert into public.dua_wall_replies (post_id, user_id, body) values (p_post, auth.uid(), trim(p_body)) returning id into v_id;
  update public.dua_wall_posts set reply_count = (select count(*) from public.dua_wall_replies where post_id = p_post and not hidden)
    where id = p_post;
  return v_id;
end;
$$;
grant execute on function public.dua_wall_reply(uuid, text) to authenticated;

create or replace function public.dua_wall_report(p_type text, p_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.dua_wall_reports (target_type, target_id, user_id, reason) values (p_type, p_id, auth.uid(), left(p_reason, 200))
  on conflict do nothing;
  if p_type = 'post' then
    update public.dua_wall_posts set report_count = (select count(*) from public.dua_wall_reports where target_type = 'post' and target_id = p_id) where id = p_id;
  else
    update public.dua_wall_replies set report_count = (select count(*) from public.dua_wall_reports where target_type = 'reply' and target_id = p_id) where id = p_id;
  end if;
end;
$$;
grant execute on function public.dua_wall_report(text, uuid, text) to authenticated;

create or replace function public.dua_wall_delete(p_type text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_post uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_type = 'post' then
    delete from public.dua_wall_posts where id = p_id and (user_id = auth.uid() or public.is_oummah_admin());
  else
    delete from public.dua_wall_replies where id = p_id and (user_id = auth.uid() or public.is_oummah_admin()) returning post_id into v_post;
    if v_post is not null then
      update public.dua_wall_posts set reply_count = (select count(*) from public.dua_wall_replies where post_id = v_post and not hidden) where id = v_post;
    end if;
  end if;
end;
$$;
grant execute on function public.dua_wall_delete(text, uuid) to authenticated;

-- « Allah m'a exaucé » (author only), with an optional word of gratitude (filtered).
create or replace function public.dua_wall_mark_answered(p_post uuid, p_gratitude text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_gratitude is not null and not public.dua_wall_text_allowed(p_gratitude) then raise exception 'TEXT_REFUSED'; end if;
  update public.dua_wall_posts
    set answered = true, answered_at = now(), gratitude = nullif(trim(p_gratitude), '')
    where id = p_post and user_id = auth.uid();
end;
$$;
grant execute on function public.dua_wall_mark_answered(uuid, text) to authenticated;

-- ----- Administration ----------------------------------------------------------------------------

create or replace function public.admin_list_dua_wall()
returns table (
  kind text, id uuid, post_id uuid, body text, author text, anonymous boolean, report_count integer, status text, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  return query
    select 'post'::text, p.id, p.id, p.body, c.pseudo, p.anonymous, p.report_count, p.status, p.created_at
    from public.dua_wall_posts p left join public.community_profiles c on c.user_id = p.user_id
    where p.status = 'pending' or (p.status = 'approved' and p.report_count > 0)
    union all
    select 'reply'::text, r.id, r.post_id, r.body, c.pseudo, false, r.report_count, case when r.hidden then 'hidden' else 'visible' end, r.created_at
    from public.dua_wall_replies r left join public.community_profiles c on c.user_id = r.user_id
    where r.report_count > 0 and not r.hidden
    order by 9 desc;
end;
$$;
grant execute on function public.admin_list_dua_wall() to authenticated;

-- approve: publish (post) / keep and clear reports (reply or reported post); reject: refuse or remove.
create or replace function public.admin_review_dua_wall(p_kind text, p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  if p_kind = 'post' then
    update public.dua_wall_posts set
      status = case when p_approve then 'approved' when status = 'pending' then 'rejected' else 'removed' end,
      report_count = case when p_approve then 0 else report_count end,
      reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_id;
    if p_approve then delete from public.dua_wall_reports where target_type = 'post' and target_id = p_id; end if;
  else
    update public.dua_wall_replies set hidden = not p_approve, report_count = case when p_approve then 0 else report_count end where id = p_id;
    if p_approve then delete from public.dua_wall_reports where target_type = 'reply' and target_id = p_id; end if;
  end if;
end;
$$;
grant execute on function public.admin_review_dua_wall(text, uuid, boolean) to authenticated;

create or replace function public.notify_admins_new_dua_post()
returns trigger language plpgsql security definer set search_path = public, auth, net as $$
begin
  if new.status = 'pending' then
    perform public.create_admin_alert_and_notify(
      'dua_wall_pending', 'dua-wall:' || new.id::text, 'info',
      'Doua à valider', left(new.body, 120), true,
      jsonb_build_object('post_id', new.id)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists notify_admins_new_dua_post_trigger on public.dua_wall_posts;
create trigger notify_admins_new_dua_post_trigger after insert on public.dua_wall_posts
for each row execute function public.notify_admins_new_dua_post();

notify pgrst, 'reload schema';
