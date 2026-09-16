-- OUMMAH — publication immédiate des mosquées créées par owner/admin.
-- La décision est prise côté Supabase à partir de la session authentifiée.

create or replace function public.prepare_mosque_submission()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  submitter_role public.oummah_admin_role;
begin
  if auth.uid() is null then
    raise exception 'USER_MOSQUE_AUTH_REQUIRED';
  end if;

  new.submitted_by := auth.uid();
  new.rejection_reason := null;

  select role
  into submitter_role
  from public.oummah_admin_users
  where user_id = auth.uid()
  limit 1;

  if submitter_role in ('owner', 'admin') then
    new.validation_status := 'approved';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  else
    new.validation_status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists mosque_submissions_prepare_insert
on public.mosque_submissions;

create trigger mosque_submissions_prepare_insert
before insert on public.mosque_submissions
for each row
execute function public.prepare_mosque_submission();

-- Une personne connectée peut soumettre une mosquée. Le trigger ci-dessus
-- impose le propriétaire, le statut et les informations de validation.
drop policy if exists "Public can submit pending mosques"
on public.mosque_submissions;

drop policy if exists "Authenticated users can submit mosques"
on public.mosque_submissions;

create policy "Authenticated users can submit mosques"
on public.mosque_submissions
for insert
to authenticated
with check (
  submitted_by = auth.uid()
  and rejection_reason is null
  and (
    (
      validation_status = 'pending'
      and reviewed_by is null
      and reviewed_at is null
    )
    or
    (
      validation_status = 'approved'
      and reviewed_by = auth.uid()
      and reviewed_at is not null
      and public.get_my_admin_role() in ('owner', 'admin')
    )
  )
);

-- Permet à l'auteur de récupérer la ligne créée avec return=representation,
-- sans rendre les propositions en attente visibles aux autres utilisateurs.
drop policy if exists "Users can read their own mosque submissions"
on public.mosque_submissions;

create policy "Users can read their own mosque submissions"
on public.mosque_submissions
for select
to authenticated
using (submitted_by = auth.uid());

revoke insert on public.mosque_submissions from anon;
grant insert on public.mosque_submissions to authenticated;

revoke all on function public.prepare_mosque_submission() from public;

notify pgrst, 'reload schema';
