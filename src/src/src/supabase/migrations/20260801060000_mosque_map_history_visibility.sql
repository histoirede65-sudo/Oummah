-- OUMMAH — carte, historique et visibilité des mosquées validées

alter table public.mosque_submissions
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references auth.users(id) on delete set null;

-- La liste publique ne doit jamais exposer une mosquée masquée.
drop policy if exists "Public can read approved mosques"
on public.mosque_submissions;

create policy "Public can read approved mosques"
on public.mosque_submissions
for select
to anon, authenticated
using (
  validation_status = 'approved'
  and is_hidden = false
);

drop function if exists public.admin_list_mosque_submissions(public.mosque_validation_status);

create or replace function public.admin_list_mosque_submissions(
  p_status public.mosque_validation_status default null
)
returns table (
  id uuid,
  name text,
  address text,
  latitude double precision,
  longitude double precision,
  validation_status public.mosque_validation_status,
  created_at timestamptz,
  updated_at timestamptz,
  reviewed_at timestamptz,
  rejection_reason text,
  is_hidden boolean,
  hidden_at timestamptz,
  submitter_email text,
  alternative_name text,
  arabic_name text,
  phone text,
  email text,
  website text,
  opening_hours text,
  operator text,
  denomination text,
  wheelchair text,
  women_space text,
  ablutions text,
  parking text,
  toilets text,
  languages text[],
  service_times text[]
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  return query
  select
    m.id,
    m.name,
    m.address,
    m.latitude,
    m.longitude,
    m.validation_status,
    m.created_at,
    m.updated_at,
    m.reviewed_at,
    m.rejection_reason,
    m.is_hidden,
    m.hidden_at,
    u.email::text,
    m.alternative_name,
    m.arabic_name,
    m.phone,
    m.email,
    m.website,
    m.opening_hours,
    m.operator,
    m.denomination,
    m.wheelchair,
    m.women_space,
    m.ablutions,
    m.parking,
    m.toilets,
    m.languages,
    m.service_times
  from public.mosque_submissions m
  left join auth.users u on u.id = m.submitted_by
  where p_status is null or m.validation_status = p_status
  order by
    case when m.validation_status = 'pending' then 0 else 1 end,
    m.created_at desc;
end;
$$;

create or replace function public.admin_list_mosque_review_history(
  p_submission_id uuid
)
returns table (
  id uuid,
  previous_status public.mosque_validation_status,
  new_status public.mosque_validation_status,
  rejection_reason text,
  created_at timestamptz,
  admin_email text,
  action_label text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  return query
  select
    h.id,
    h.previous_status,
    h.new_status,
    h.rejection_reason,
    h.created_at,
    u.email::text,
    case
      when h.previous_status = h.new_status then 'Informations corrigées'
      when h.new_status = 'approved' then 'Mosquée validée'
      when h.new_status = 'rejected' then 'Mosquée refusée'
      else 'Statut remis en attente'
    end
  from public.mosque_review_history h
  left join auth.users u on u.id = h.admin_user_id
  where h.submission_id = p_submission_id
  order by h.created_at desc;
end;
$$;

create or replace function public.admin_set_mosque_visibility(
  p_submission_id uuid,
  p_hidden boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  mosque_row public.mosque_submissions%rowtype;
begin
  if not public.is_oummah_admin() then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  select *
  into mosque_row
  from public.mosque_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'MOSQUE_SUBMISSION_NOT_FOUND';
  end if;

  if mosque_row.validation_status <> 'approved' then
    raise exception 'ONLY_APPROVED_MOSQUE_CAN_CHANGE_VISIBILITY';
  end if;

  update public.mosque_submissions
  set
    is_hidden = coalesce(p_hidden, false),
    hidden_at = case when coalesce(p_hidden, false) then now() else null end,
    hidden_by = case when coalesce(p_hidden, false) then auth.uid() else null end,
    updated_at = now()
  where id = p_submission_id;

  insert into public.mosque_review_history (
    submission_id,
    admin_user_id,
    previous_status,
    new_status,
    rejection_reason,
    snapshot
  )
  values (
    mosque_row.id,
    auth.uid(),
    mosque_row.validation_status,
    mosque_row.validation_status,
    case
      when coalesce(p_hidden, false) then 'Mosquée masquée du public'
      else 'Mosquée réaffichée au public'
    end,
    jsonb_build_object(
      'action', case when coalesce(p_hidden, false) then 'hidden' else 'visible' end,
      'is_hidden', coalesce(p_hidden, false)
    )
  );

  return jsonb_build_object(
    'id', p_submission_id,
    'is_hidden', coalesce(p_hidden, false)
  );
end;
$$;

revoke all on function
  public.admin_list_mosque_review_history(uuid)
from public;

revoke all on function
  public.admin_set_mosque_visibility(uuid, boolean)
from public;

grant execute on function
  public.admin_list_mosque_review_history(uuid)
to authenticated;

grant execute on function
  public.admin_set_mosque_visibility(uuid, boolean)
to authenticated;

-- Recharge le cache PostgREST après création/remplacement des fonctions.
notify pgrst, 'reload schema';
