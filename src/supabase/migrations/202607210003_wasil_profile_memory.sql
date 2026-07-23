create table if not exists public.wasil_profile_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null check (
    memory_key in (
      'preferred_reciter',
      'preferred_translation',
      'preferred_tafsir',
      'preferred_study_time',
      'daily_time_minutes',
      'learning_goal',
      'answer_depth',
      'preferred_language'
    )
  ),
  memory_value text not null check (
    char_length(memory_value) between 1 and 500
  ),
  display_label text not null check (
    char_length(display_label) between 1 and 80
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, memory_key)
);

alter table public.wasil_profile_memories enable row level security;

drop policy if exists "Users read their Wasil profile memories"
  on public.wasil_profile_memories;
create policy "Users read their Wasil profile memories"
  on public.wasil_profile_memories for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.list_wasil_profile_memories(
  p_user_id uuid
) returns table (
  memory_key text,
  memory_value text,
  display_label text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    memory.memory_key,
    memory.memory_value,
    memory.display_label,
    memory.updated_at
  from public.wasil_profile_memories as memory
  where memory.user_id = p_user_id
  order by memory.updated_at desc;
$$;

create or replace function public.set_wasil_profile_memory(
  p_user_id uuid,
  p_memory_key text,
  p_memory_value text,
  p_display_label text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_memory_key not in (
    'preferred_reciter',
    'preferred_translation',
    'preferred_tafsir',
    'preferred_study_time',
    'daily_time_minutes',
    'learning_goal',
    'answer_depth',
    'preferred_language'
  ) then
    raise exception 'INVALID_WASIL_MEMORY_KEY';
  end if;
  if char_length(trim(p_memory_value)) not between 1 and 500 then
    raise exception 'INVALID_WASIL_MEMORY_VALUE';
  end if;

  insert into public.wasil_profile_memories(
    user_id,
    memory_key,
    memory_value,
    display_label
  ) values (
    p_user_id,
    p_memory_key,
    left(trim(p_memory_value), 500),
    left(trim(p_display_label), 80)
  )
  on conflict (user_id, memory_key) do update
  set memory_value = excluded.memory_value,
      display_label = excluded.display_label,
      updated_at = now();
end;
$$;

create or replace function public.delete_wasil_profile_memory(
  p_user_id uuid,
  p_memory_key text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.wasil_profile_memories
  where user_id = p_user_id and memory_key = p_memory_key;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.clear_wasil_profile_memories(
  p_user_id uuid
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.wasil_profile_memories where user_id = p_user_id;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.list_wasil_profile_memories(uuid)
  from public, anon, authenticated;
revoke all on function public.set_wasil_profile_memory(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.delete_wasil_profile_memory(uuid, text)
  from public, anon, authenticated;
revoke all on function public.clear_wasil_profile_memories(uuid)
  from public, anon, authenticated;

grant execute on function public.list_wasil_profile_memories(uuid)
  to service_role;
grant execute on function public.set_wasil_profile_memory(uuid, text, text, text)
  to service_role;
grant execute on function public.delete_wasil_profile_memory(uuid, text)
  to service_role;
grant execute on function public.clear_wasil_profile_memories(uuid)
  to service_role;
