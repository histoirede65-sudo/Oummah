-- OUMMAH — messagerie privée : réactions aux messages (cœur, pouce…).
--
-- Règles :
--  * Une réaction par membre et par message, choisie dans une liste fixe ; la même réaction la retire.
--  * Seulement sur un message de la conversation (envoyé ou reçu), jamais si l'un a bloqué l'autre.
--  * Supprimer le message supprime ses réactions.
--  * chat_thread n'est pas modifiée : les anciennes versions de l'app continuent de fonctionner.

create table if not exists public.community_message_reactions (
  message_id uuid not null references public.community_messages (id) on delete cascade,
  member uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '👍', '🤲', '😂', '😮', '😢')),
  created_at timestamptz not null default now(),
  primary key (message_id, member)
);

alter table public.community_message_reactions enable row level security;
revoke all on public.community_message_reactions from anon, authenticated;

-- Sets my reaction on a message; p_emoji null (or the same one again) removes it. Returns the reaction kept.
create or replace function public.chat_react(p_id uuid, p_emoji text)
returns text language plpgsql security definer set search_path = public as $$
declare v_sender uuid; v_recipient uuid; v_other uuid; v_current text;
begin
  perform public.community_require_profile();
  select sender, recipient into v_sender, v_recipient from public.community_messages where id = p_id;
  if v_sender is null or auth.uid() not in (v_sender, v_recipient) then raise exception 'NOT_FOUND'; end if;
  v_other := case when v_sender = auth.uid() then v_recipient else v_sender end;
  if public.community_blocked_between(auth.uid(), v_other) then raise exception 'NOT_FRIENDS'; end if;

  select emoji into v_current from public.community_message_reactions where message_id = p_id and member = auth.uid();
  if p_emoji is null or p_emoji = v_current then
    delete from public.community_message_reactions where message_id = p_id and member = auth.uid();
    return null;
  end if;
  insert into public.community_message_reactions (message_id, member, emoji) values (p_id, auth.uid(), p_emoji)
    on conflict (message_id, member) do update set emoji = excluded.emoji, created_at = now();
  return p_emoji;
end;
$$;
grant execute on function public.chat_react(uuid, text) to authenticated;

-- Reactions of the conversation with p_user, on messages at or after p_since.
create or replace function public.chat_reactions(p_user uuid, p_since timestamptz default null)
returns table (message_id uuid, emoji text, mine boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.community_require_profile();
  if public.community_blocked_between(auth.uid(), p_user) then return; end if;
  return query
    select r.message_id, r.emoji, r.member = auth.uid()
    from public.community_message_reactions r
    join public.community_messages m on m.id = r.message_id
    where ((m.sender = auth.uid() and m.recipient = p_user) or (m.sender = p_user and m.recipient = auth.uid()))
      and (p_since is null or m.created_at >= p_since);
end;
$$;
grant execute on function public.chat_reactions(uuid, timestamptz) to authenticated;
