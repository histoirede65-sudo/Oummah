-- Autorise uniquement le compte administrateur OUMMAH à consulter et modérer toutes les propositions.
alter table public.mosque_submissions enable row level security;

drop policy if exists "Admin can read all mosque submissions" on public.mosque_submissions;
create policy "Admin can read all mosque submissions" on public.mosque_submissions
for select to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bahri13015@hotmail.fr');

drop policy if exists "Admin can update mosque submissions" on public.mosque_submissions;
create policy "Admin can update mosque submissions" on public.mosque_submissions
for update to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bahri13015@hotmail.fr')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'bahri13015@hotmail.fr');

grant select, update on public.mosque_submissions to authenticated;
