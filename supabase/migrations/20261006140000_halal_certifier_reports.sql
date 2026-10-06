-- OUMMAH — Scan : « Indiquer le certificateur ».
--
-- Quand Open Food Facts ne nomme pas l'organisme, l'utilisateur choisit le logo qu'il voit sur
-- l'emballage et joint une photo. L'équipe vérifie la photo dans « À traiter » : une fois validé,
-- le certificateur est affiché pour ce code-barres, pour tout le monde, avec la mention de la source.

create table if not exists public.halal_certifier_reports (
  id uuid primary key default gen_random_uuid(),
  barcode text not null check (barcode ~ '^[0-9]{6,14}$'),
  product_name text check (length(product_name) <= 200),
  certifier_id text check (length(certifier_id) <= 60),
  other_certifier text check (length(other_certifier) <= 80),
  photo_path text not null check (photo_path ~ '^pending/[A-Za-z0-9._-]+$'),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (certifier_id is not null or other_certifier is not null)
);
create index if not exists halal_certifier_reports_pending_idx on public.halal_certifier_reports (created_at) where status = 'pending';

create table if not exists public.halal_product_certifiers (
  barcode text primary key,
  certifier_id text not null,
  report_id uuid references public.halal_certifier_reports (id) on delete set null,
  verified_at timestamptz not null default now()
);

alter table public.halal_certifier_reports enable row level security;
alter table public.halal_product_certifiers enable row level security;
revoke all on public.halal_certifier_reports, public.halal_product_certifiers from anon, authenticated;

-- Photos: private bucket, anyone can drop a photo in pending/, only the team can read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('halal-certifier-reports', 'halal-certifier-reports', false, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

drop policy if exists "Anyone uploads a certifier photo" on storage.objects;
create policy "Anyone uploads a certifier photo" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'halal-certifier-reports' and (storage.foldername(name))[1] = 'pending');
drop policy if exists "Team reads certifier photos" on storage.objects;
create policy "Team reads certifier photos" on storage.objects for select to authenticated
  using (bucket_id = 'halal-certifier-reports' and public.is_oummah_admin());
drop policy if exists "Team deletes certifier photos" on storage.objects;
create policy "Team deletes certifier photos" on storage.objects for delete to authenticated
  using (bucket_id = 'halal-certifier-reports' and public.is_oummah_admin());

create or replace function public.submit_halal_certifier_report(
  p_barcode text, p_product_name text, p_certifier_id text, p_other text, p_photo_path text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if (select count(*) from public.halal_certifier_reports where barcode = p_barcode and status = 'pending') >= 5 then
    raise exception 'TOO_MANY_REPORTS';
  end if;
  insert into public.halal_certifier_reports (barcode, product_name, certifier_id, other_certifier, photo_path, user_id)
  values (p_barcode, left(nullif(trim(p_product_name), ''), 200), nullif(trim(p_certifier_id), ''), left(nullif(trim(p_other), ''), 80), p_photo_path, auth.uid())
  returning id into v_id;
  begin
    perform public.create_admin_alert_and_notify(
      'halal_certifier_report', 'halal-certifier:' || v_id::text, 'info',
      'Certificateur indiqué pour un produit', coalesce(left(p_product_name, 80), p_barcode), false,
      jsonb_build_object('report_id', v_id, 'barcode', p_barcode)
    );
  exception when others then
    null; -- the report is kept even if the alert fails
  end;
  return v_id;
end;
$$;
grant execute on function public.submit_halal_certifier_report(text, text, text, text, text) to anon, authenticated;

-- Read by the scan result: the certifier confirmed by the team for this barcode, if any.
create or replace function public.get_halal_product_certifier(p_barcode text)
returns text language sql stable security definer set search_path = public as $$
  select certifier_id from public.halal_product_certifiers where barcode = p_barcode;
$$;
grant execute on function public.get_halal_product_certifier(text) to anon, authenticated;

create or replace function public.admin_list_halal_certifier_reports()
returns table (id uuid, barcode text, product_name text, certifier_id text, other_certifier text, photo_path text, created_at timestamptz, current_certifier text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  return query
    select r.id, r.barcode, r.product_name, r.certifier_id, r.other_certifier, r.photo_path, r.created_at,
      (select c.certifier_id from public.halal_product_certifiers c where c.barcode = r.barcode)
    from public.halal_certifier_reports r where r.status = 'pending' order by r.created_at;
end;
$$;
grant execute on function public.admin_list_halal_certifier_reports() to authenticated;

-- Approve with the certifier the team read on the photo (may differ from the one chosen by the user).
create or replace function public.admin_review_halal_certifier_report(p_id uuid, p_approve boolean, p_certifier_id text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_report public.halal_certifier_reports;
begin
  if not public.is_oummah_admin() then raise exception 'ADMIN_FORBIDDEN'; end if;
  select * into v_report from public.halal_certifier_reports where id = p_id;
  if v_report.id is null then raise exception 'NOT_FOUND'; end if;
  if p_approve then
    if coalesce(nullif(trim(p_certifier_id), ''), v_report.certifier_id) is null then raise exception 'CERTIFIER_REQUIRED'; end if;
    insert into public.halal_product_certifiers (barcode, certifier_id, report_id, verified_at)
    values (v_report.barcode, coalesce(nullif(trim(p_certifier_id), ''), v_report.certifier_id), p_id, now())
    on conflict (barcode) do update set certifier_id = excluded.certifier_id, report_id = excluded.report_id, verified_at = now();
    -- Other pending reports for the same product are settled by this decision.
    update public.halal_certifier_reports set status = 'approved', reviewed_at = now() where barcode = v_report.barcode and status = 'pending';
  else
    update public.halal_certifier_reports set status = 'rejected', reviewed_at = now() where id = p_id;
  end if;
end;
$$;
grant execute on function public.admin_review_halal_certifier_report(uuid, boolean, text) to authenticated;

notify pgrst, 'reload schema';
