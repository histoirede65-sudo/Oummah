-- OUMMAH Hadith themes foundation.
-- Schema only: no themes, associations, or religious content are inserted.

create table if not exists public.hadith_themes (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null,
  slug text not null,
  parent_theme_id uuid references public.hadith_themes(id) on delete restrict,
  status text not null default 'Importée',
  version text not null,
  sort_order integer not null default 0,
  visual_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_themes_stable_key_not_blank check (length(btrim(stable_key)) > 0),
  constraint hadith_themes_slug_not_blank check (length(btrim(slug)) > 0),
  constraint hadith_themes_status_allowed check (status in (
    'Importée', 'Validée', 'Juridiquement validée',
    'Disponible en développement', 'Disponible en bêta',
    'Disponible en production', 'Suspendue', 'Retirée',
    'Archivée', 'Rejetée'
  )),
  constraint hadith_themes_version_not_blank check (length(btrim(version)) > 0),
  constraint hadith_themes_sort_order_nonnegative check (sort_order >= 0),
  constraint hadith_themes_stable_key_key unique (stable_key),
  constraint hadith_themes_slug_key unique (slug)
);

create table if not exists public.hadith_theme_translations (
  theme_id uuid not null references public.hadith_themes(id) on delete cascade,
  language_code text not null,
  name text not null,
  description text,
  publication_status text not null default 'Importée',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint hadith_theme_translations_pkey primary key (theme_id, language_code),
  constraint hadith_theme_translations_language_code_format
    check (language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  constraint hadith_theme_translations_name_not_blank check (length(btrim(name)) > 0),
  constraint hadith_theme_translations_status_allowed check (publication_status in (
    'Importée', 'Validée', 'Juridiquement validée',
    'Disponible en développement', 'Disponible en bêta',
    'Disponible en production', 'Suspendue', 'Retirée',
    'Archivée', 'Rejetée'
  ))
);

create table if not exists public.hadith_theme_assignments (
  hadith_id uuid not null references public.hadiths(id) on delete cascade,
  theme_id uuid not null references public.hadith_themes(id) on delete cascade,
  association_origin text not null,
  source_category_id text,
  source_category_label text,
  source_version_id uuid references public.hadith_source_versions(id) on delete restrict,
  validation_status text not null default 'unvalidated',
  version text not null,
  associated_at timestamptz not null default now(),

  constraint hadith_theme_assignments_origin_allowed check (association_origin in (
    'source', 'oummah_editorial', 'automatic_unvalidated'
  )),
  constraint hadith_theme_assignments_validation_status_allowed check (validation_status in (
    'unvalidated', 'validated', 'rejected'
  )),
  constraint hadith_theme_assignments_version_not_blank check (length(btrim(version)) > 0),
  constraint hadith_theme_assignments_source_category_id_not_blank
    check (source_category_id is null or length(btrim(source_category_id)) > 0),
  constraint hadith_theme_assignments_source_category_label_not_blank
    check (source_category_label is null or length(btrim(source_category_label)) > 0)
);

create unique index if not exists hadith_theme_assignments_identity_key
  on public.hadith_theme_assignments (
    hadith_id,
    theme_id,
    association_origin,
    coalesce(source_version_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(source_category_id, '')
  );

create index if not exists hadith_themes_parent_idx
  on public.hadith_themes(parent_theme_id, sort_order, id);

create index if not exists hadith_theme_translations_language_idx
  on public.hadith_theme_translations(language_code, publication_status, theme_id);

create index if not exists hadith_theme_assignments_hadith_idx
  on public.hadith_theme_assignments(hadith_id, validation_status, theme_id);

create index if not exists hadith_theme_assignments_theme_idx
  on public.hadith_theme_assignments(theme_id, validation_status, hadith_id);

create index if not exists hadith_theme_assignments_provenance_idx
  on public.hadith_theme_assignments(association_origin, source_version_id);

create index if not exists hadith_theme_assignments_validation_idx
  on public.hadith_theme_assignments(validation_status, theme_id, hadith_id);

-- Counts are computed from published hadiths, translations, and approved
-- associations. The language is selected by filtering language_code.
create or replace view public.hadith_published_theme_counts
with (security_invoker = true)
as
select
  t.id as theme_id,
  t.stable_key,
  t.slug,
  tt.language_code,
  tt.name,
  tt.description,
  count(distinct h.id)::integer as hadith_count
from public.hadith_themes t
join public.hadith_theme_translations tt
  on tt.theme_id = t.id
join public.hadith_theme_assignments a
  on a.theme_id = t.id
join public.hadiths h
  on h.id = a.hadith_id
join public.hadith_translations ht
  on ht.hadith_id = h.id
 and ht.language_code = tt.language_code
left join public.hadith_source_versions sv
  on sv.id = a.source_version_id
where t.status = 'Disponible en production'
  and tt.publication_status = 'Disponible en production'
  and public.hadith_translation_is_public(ht.id)
  and (
    a.validation_status = 'validated'
    or (
      a.association_origin = 'source'
      and sv.status = 'Disponible en production'
    )
  )
group by t.id, t.stable_key, t.slug, tt.language_code, tt.name, tt.description;

alter table public.hadith_themes enable row level security;
alter table public.hadith_theme_translations enable row level security;
alter table public.hadith_theme_assignments enable row level security;

revoke all on table public.hadith_themes, public.hadith_theme_translations, public.hadith_theme_assignments
  from public, anon, authenticated;
grant select on table public.hadith_themes, public.hadith_theme_translations, public.hadith_theme_assignments
  to anon, authenticated;
grant all on table public.hadith_themes, public.hadith_theme_translations, public.hadith_theme_assignments
  to service_role;

drop policy if exists hadith_themes_public_read on public.hadith_themes;
create policy hadith_themes_public_read on public.hadith_themes
for select to anon, authenticated
using (
  status = 'Disponible en production'
  and exists (
    select 1
    from public.hadith_theme_translations tt
    where tt.theme_id = id
      and tt.publication_status = 'Disponible en production'
  )
);

drop policy if exists hadith_theme_translations_public_read on public.hadith_theme_translations;
create policy hadith_theme_translations_public_read on public.hadith_theme_translations
for select to anon, authenticated
using (
  publication_status = 'Disponible en production'
  and exists (
    select 1
    from public.hadith_themes t
    where t.id = theme_id
      and t.status = 'Disponible en production'
  )
);

drop policy if exists hadith_theme_assignments_public_read on public.hadith_theme_assignments;
create policy hadith_theme_assignments_public_read on public.hadith_theme_assignments
for select to anon, authenticated
using (
  (
    validation_status = 'validated'
    or (
      association_origin = 'source'
      and source_version_id is not null
      and exists (
        select 1
        from public.hadith_source_versions sv
        where sv.id = source_version_id
          and sv.status = 'Disponible en production'
      )
    )
  )
  and exists (
    select 1
    from public.hadith_themes t
    where t.id = theme_id
      and t.status = 'Disponible en production'
  )
  and exists (
    select 1
    from public.hadiths h
    where h.id = hadith_id
      and h.lifecycle_status = 'Disponible en production'
      and public.hadith_has_public_translation(h.id)
  )
);

revoke all on public.hadith_published_theme_counts from public, anon, authenticated;
grant select on public.hadith_published_theme_counts to anon, authenticated;

comment on table public.hadith_themes is
  'Documentary themes independent from hadith collections; no manual counters.';
comment on table public.hadith_theme_translations is
  'Localized names and descriptions for documentary themes.';
comment on table public.hadith_theme_assignments is
  'Many-to-many hadith/theme links with explicit provenance and validation status.';
comment on view public.hadith_published_theme_counts is
  'Counts published hadiths by theme and language; filter language_code as needed.';
