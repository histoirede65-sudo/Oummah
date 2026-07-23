drop policy if exists "Users delete their own Wasil conversations"
  on public.wasil_conversations;

create policy "Users delete their own Wasil conversations"
on public.wasil_conversations
for delete
to authenticated
using (auth.uid() = user_id);
