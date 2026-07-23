create table if not exists public.wasil_intent_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_question text not null,
  clarification text not null,
  source_ids text[] not null check (cardinality(source_ids) > 0),
  reuse_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, normalized_question)
);

alter table public.wasil_intent_memories enable row level security;

drop policy if exists "Users read their Wasil intent memories"
  on public.wasil_intent_memories;
create policy "Users read their Wasil intent memories"
  on public.wasil_intent_memories for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.find_wasil_intent_memory(
  p_user_id uuid,
  p_normalized_question text
) returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_ids text[];
begin
  update public.wasil_intent_memories
  set reuse_count = reuse_count + 1, updated_at = now()
  where user_id = p_user_id
    and normalized_question = p_normalized_question
  returning source_ids into v_source_ids;
  return v_source_ids;
end;
$$;

create or replace function public.remember_wasil_intent(
  p_user_id uuid,
  p_normalized_question text,
  p_clarification text,
  p_source_ids text[]
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_normalized_question = '' or cardinality(p_source_ids) = 0 then
    raise exception 'INVALID_INTENT_MEMORY';
  end if;

  insert into public.wasil_intent_memories(
    user_id, normalized_question, clarification, source_ids
  ) values (
    p_user_id, p_normalized_question, left(p_clarification, 1200), p_source_ids
  )
  on conflict (user_id, normalized_question) do update
  set clarification = excluded.clarification,
      source_ids = excluded.source_ids,
      updated_at = now();
end;
$$;

revoke all on function public.find_wasil_intent_memory(uuid, text)
  from public, anon, authenticated;
revoke all on function public.remember_wasil_intent(uuid, text, text, text[])
  from public, anon, authenticated;
grant execute on function public.find_wasil_intent_memory(uuid, text)
  to service_role;
grant execute on function public.remember_wasil_intent(uuid, text, text, text[])
  to service_role;
