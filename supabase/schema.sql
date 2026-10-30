-- Shared collections: the roster, and what a student and a mentor both see
-- and change.
-- Safe to run more than once.
-- One row per item, so two people saving different items never collide.
-- `data` is the item exactly as the app holds it.
--
-- Only signed-in people can read or write. Accounts are made with
-- scripts/create-accounts.mjs. Also turn OFF "Allow new users to sign up"
-- (Authentication → Providers → Email), or anyone with the publishable key can
-- create an account and count as signed in.

create table if not exists public.people (
  id text primary key,
  project_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  project_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.artefacts (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_progress (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Notifications. There is no project on a deadline reminder, so project_id may
-- be empty here; the person each is for is in the data.
create table if not exists public.notifications (
  id text primary key,
  project_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- The activity log. One row per event, written once. It has no update or
-- delete policy below, so with row level security on nobody can change or
-- remove an entry, the app included. created_at is set by the database, not
-- by the browser, and is what the log is ordered by.
create table if not exists public.activity_log (
  id text primary key,
  project_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_project_time
  on public.activity_log (project_id, created_at desc);

alter table public.people enable row level security;
alter table public.projects enable row level security;
alter table public.notes enable row level security;
alter table public.action_items enable row level security;
alter table public.artefacts enable row level security;
alter table public.weekly_progress enable row level security;
alter table public.milestones enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_log enable row level security;

do $$
declare t text;
begin
  foreach t in array array['people', 'projects', 'notes', 'action_items', 'artefacts', 'weekly_progress', 'milestones', 'submissions', 'reviews', 'comments', 'notifications'] loop
    execute format('drop policy if exists "open access" on public.%I', t);
    execute format('drop policy if exists "signed in" on public.%I', t);
    execute format(
      'create policy "signed in" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- The log: read and add only. No update, no delete.
drop policy if exists "log read" on public.activity_log;
drop policy if exists "log add" on public.activity_log;
create policy "log read" on public.activity_log for select to authenticated using (true);
create policy "log add" on public.activity_log for insert to authenticated with check (true);

-- Safe to run again: a table already published is skipped.
do $$
declare t text;
begin
  foreach t in array array['people', 'projects', 'notes', 'action_items', 'artefacts', 'weekly_progress', 'milestones', 'submissions', 'reviews', 'comments', 'notifications'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Profile photos: a public bucket, 2 MB per file, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- Photos are shown from a public address, so reading needs no policy; only
-- signed-in people can add or change one.
drop policy if exists "avatars open access" on storage.objects;
drop policy if exists "avatars signed in" on storage.objects;
create policy "avatars signed in" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

-- Weekly progress files: a private bucket, 25 MB per file. Nothing here has a
-- public address; the app opens a file through a short-lived signed link.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-files', 'progress-files', false, 26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'image/png', 'image/jpeg', 'image/webp'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "progress files signed in" on storage.objects;
create policy "progress files signed in" on storage.objects
  for all to authenticated
  using (bucket_id = 'progress-files')
  with check (bucket_id = 'progress-files');

-- Roster change: Panem Chaitanya Pavan Kumar has left the programme.
delete from public.people where id = 'p-2025204023';
