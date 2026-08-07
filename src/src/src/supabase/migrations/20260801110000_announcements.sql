do $$ begin
 if not exists(select 1 from pg_type where typname='announcement_audience') then create type public.announcement_audience as enum('all','free','premium'); end if;
 if not exists(select 1 from pg_type where typname='announcement_status') then create type public.announcement_status as enum('draft','published','archived'); end if;
end $$;
create table if not exists public.oummah_announcements(
 id uuid primary key default gen_random_uuid(), title text not null, body text not null,
 audience public.announcement_audience not null default 'all', status public.announcement_status not null default 'draft',
 action_label text, action_route text, starts_at timestamptz not null default now(), ends_at timestamptz,
 show_on_home boolean not null default true, show_in_notifications boolean not null default true,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(char_length(trim(title)) between 3 and 140), check(char_length(trim(body)) between 5 and 1200),
 check(ends_at is null or ends_at>starts_at)
);
alter table public.oummah_announcements enable row level security;
revoke all on public.oummah_announcements from anon,authenticated;

create or replace function public.get_active_announcements(p_placement text,p_audience text)
returns table(id uuid,title text,body text,audience public.announcement_audience,action_label text,action_route text,starts_at timestamptz,ends_at timestamptz,show_on_home boolean,show_in_notifications boolean,created_at timestamptz)
language sql stable security definer set search_path=public as $$
 select a.id,a.title,a.body,a.audience,a.action_label,a.action_route,a.starts_at,a.ends_at,a.show_on_home,a.show_in_notifications,a.created_at
 from public.oummah_announcements a where a.status='published' and a.starts_at<=now() and (a.ends_at is null or a.ends_at>now())
 and (a.audience='all' or a.audience::text=p_audience)
 and ((p_placement='home' and a.show_on_home) or (p_placement='notifications' and a.show_in_notifications))
 order by a.starts_at desc;
$$;
create or replace function public.admin_list_announcements()
returns setof public.oummah_announcements language plpgsql security definer set search_path=public as $$ begin if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if; return query select * from public.oummah_announcements order by created_at desc; end $$;
create or replace function public.admin_save_announcement(p_id uuid,p_title text,p_body text,p_audience public.announcement_audience,p_status public.announcement_status,p_action_label text,p_action_route text,p_starts_at timestamptz,p_ends_at timestamptz,p_show_on_home boolean,p_show_in_notifications boolean)
returns uuid language plpgsql security definer set search_path=public as $$ declare result_id uuid; begin if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
 if p_id is null then insert into public.oummah_announcements(title,body,audience,status,action_label,action_route,starts_at,ends_at,show_on_home,show_in_notifications,created_by,updated_by) values(trim(p_title),trim(p_body),p_audience,p_status,nullif(trim(p_action_label),''),nullif(trim(p_action_route),''),p_starts_at,p_ends_at,p_show_on_home,p_show_in_notifications,auth.uid(),auth.uid()) returning id into result_id;
 else update public.oummah_announcements set title=trim(p_title),body=trim(p_body),audience=p_audience,status=p_status,action_label=nullif(trim(p_action_label),''),action_route=nullif(trim(p_action_route),''),starts_at=p_starts_at,ends_at=p_ends_at,show_on_home=p_show_on_home,show_in_notifications=p_show_in_notifications,updated_by=auth.uid(),updated_at=now() where id=p_id returning id into result_id; end if; return result_id; end $$;
create or replace function public.admin_archive_announcement(p_id uuid) returns void language plpgsql security definer set search_path=public as $$ begin if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if; update public.oummah_announcements set status='archived',updated_by=auth.uid(),updated_at=now() where id=p_id; end $$;
revoke all on function public.get_active_announcements(text,text) from public; grant execute on function public.get_active_announcements(text,text) to anon,authenticated;
revoke all on function public.admin_list_announcements() from public; grant execute on function public.admin_list_announcements() to authenticated;
revoke all on function public.admin_save_announcement(uuid,text,text,public.announcement_audience,public.announcement_status,text,text,timestamptz,timestamptz,boolean,boolean) from public; grant execute on function public.admin_save_announcement(uuid,text,text,public.announcement_audience,public.announcement_status,text,text,timestamptz,timestamptz,boolean,boolean) to authenticated;
revoke all on function public.admin_archive_announcement(uuid) from public; grant execute on function public.admin_archive_announcement(uuid) to authenticated;
notify pgrst,'reload schema';
