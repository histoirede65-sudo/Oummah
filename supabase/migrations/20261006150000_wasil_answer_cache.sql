-- Answers to frequent questions, reused for 30 days so the same question is answered at once.
-- Only answers that depend on nothing personal are stored (no conversation, position or profile memory).
create table if not exists public.wasil_answer_cache (
  cache_key text primary key,
  question text not null,
  mode text not null,
  reply jsonb not null,
  created_at timestamptz not null default now(),
  hits integer not null default 0,
  last_hit_at timestamptz
);

alter table public.wasil_answer_cache enable row level security;
revoke all on public.wasil_answer_cache from anon, authenticated;

create or replace function public.get_wasil_cached_answer(p_cache_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reply jsonb;
begin
  update public.wasil_answer_cache
     set hits = hits + 1, last_hit_at = now()
   where cache_key = p_cache_key
     and created_at > now() - interval '30 days'
  returning reply into v_reply;
  return v_reply;
end;
$$;

create or replace function public.put_wasil_cached_answer(p_cache_key text, p_question text, p_mode text, p_reply jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.wasil_answer_cache (cache_key, question, mode, reply)
  values (p_cache_key, left(p_question, 1200), p_mode, p_reply)
  on conflict (cache_key) do update
    set question = excluded.question, reply = excluded.reply, created_at = now(), hits = 0, last_hit_at = null;
  delete from public.wasil_answer_cache where created_at < now() - interval '30 days';
$$;

revoke all on function public.get_wasil_cached_answer(text) from public, anon, authenticated;
revoke all on function public.put_wasil_cached_answer(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.get_wasil_cached_answer(text) to service_role;
grant execute on function public.put_wasil_cached_answer(text, text, text, jsonb) to service_role;
