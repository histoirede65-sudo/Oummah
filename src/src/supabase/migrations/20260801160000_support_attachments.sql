create table if not exists public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null,
  file_name text not null,
  content_type text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_diagnostics (
  ticket_id uuid primary key,
  app_version text,
  platform text,
  os_version text,
  device_model text,
  screen_name text,
  captured_at timestamptz default now()
);
