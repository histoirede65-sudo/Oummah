-- OUMMAH — modération avancée des propositions de mosquées
-- Migration volontairement nouvelle pour éviter tout conflit avec les précédentes.

create table if not exists public.mosque_review_history (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.mosque_submissions(id) on delete cascade,
  admin_user_id uuid not null
    references auth.users(id) on delete restrict,
  previous_status public.mosque_validation_status not null,
  new_status public.mosque_validation_status not null,
  rejection_reason text,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists mosque_review_history_submission_created_idx
  on public.mosque_review_history(submission_id, created_at desc);

alter table public.mosque_review_history enable row level security;

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
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'bahri13015@hotmail.fr' then
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
    u.email::text as submitter_email,
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

create or replace function public.admin_review_mosque_submission(
  p_submission_id uuid,
  p_status public.mosque_validation_status,
  p_rejection_reason text default null,
  p_name text default null,
  p_address text default null,
  p_alternative_name text default null,
  p_arabic_name text default null,
  p_phone text default null,
  p_email text default null,
  p_website text default null,
  p_opening_hours text default null,
  p_operator text default null,
  p_denomination text default null,
  p_languages text[] default '{}',
  p_service_times text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_row public.mosque_submissions%rowtype;
  result_row public.mosque_submissions%rowtype;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> 'bahri13015@hotmail.fr' then
    raise exception 'ADMIN_FORBIDDEN';
  end if;

  select *
  into current_row
  from public.mosque_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'MOSQUE_SUBMISSION_NOT_FOUND';
  end if;

  if p_status = 'rejected'
     and nullif(trim(coalesce(p_rejection_reason, '')), '') is null then
    raise exception 'MOSQUE_REJECTION_REASON_REQUIRED';
  end if;

  if nullif(trim(coalesce(p_name, current_row.name)), '') is null then
    raise exception 'MOSQUE_NAME_REQUIRED';
  end if;

  if nullif(trim(coalesce(p_address, current_row.address)), '') is null then
    raise exception 'MOSQUE_ADDRESS_REQUIRED';
  end if;

  update public.mosque_submissions
  set
    name = trim(coalesce(p_name, current_row.name)),
    address = trim(coalesce(p_address, current_row.address)),
    alternative_name = nullif(trim(coalesce(p_alternative_name, '')), ''),
    arabic_name = nullif(trim(coalesce(p_arabic_name, '')), ''),
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    email = nullif(trim(coalesce(p_email, '')), ''),
    website = nullif(trim(coalesce(p_website, '')), ''),
    opening_hours = nullif(trim(coalesce(p_opening_hours, '')), ''),
    operator = nullif(trim(coalesce(p_operator, '')), ''),
    denomination = nullif(trim(coalesce(p_denomination, '')), ''),
    languages = coalesce(p_languages, '{}'),
    service_times = coalesce(p_service_times, '{}'),
    validation_status = p_status,
    rejection_reason = case
      when p_status = 'rejected'
        then nullif(trim(coalesce(p_rejection_reason, '')), '')
      else null
    end,
    reviewed_by = case
      when p_status = 'pending' then current_row.reviewed_by
      else auth.uid()
    end,
    reviewed_at = case
      when p_status = 'pending' then current_row.reviewed_at
      else now()
    end,
    updated_at = now()
  where id = p_submission_id
  returning * into result_row;

  insert into public.mosque_review_history (
    submission_id,
    admin_user_id,
    previous_status,
    new_status,
    rejection_reason,
    snapshot
  )
  values (
    result_row.id,
    auth.uid(),
    current_row.validation_status,
    result_row.validation_status,
    result_row.rejection_reason,
    to_jsonb(result_row)
  );

  return jsonb_build_object(
    'id', result_row.id,
    'status', result_row.validation_status,
    'updated_at', result_row.updated_at
  );
end;
$$;

revoke all on function
  public.admin_list_mosque_submissions(public.mosque_validation_status)
from public;

revoke all on function
  public.admin_review_mosque_submission(
    uuid,
    public.mosque_validation_status,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    text[]
  )
from public;

grant execute on function
  public.admin_list_mosque_submissions(public.mosque_validation_status)
to authenticated;

grant execute on function
  public.admin_review_mosque_submission(
    uuid,
    public.mosque_validation_status,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    text[]
  )
to authenticated;

revoke all on public.mosque_review_history from anon, authenticated;
