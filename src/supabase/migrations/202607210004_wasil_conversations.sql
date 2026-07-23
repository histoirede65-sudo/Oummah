create table if not exists public.wasil_conversations (
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text not null,
  conversation jsonb not null,
  created_at bigint not null,
  updated_at bigint not null,
  primary key (user_id, conversation_id)
);

alter table public.wasil_conversations enable row level security;

drop policy if exists "Users read their Wasil conversations" on public.wasil_conversations;
create policy "Users read their Wasil conversations"
on public.wasil_conversations for select
using (auth.uid() = user_id);
