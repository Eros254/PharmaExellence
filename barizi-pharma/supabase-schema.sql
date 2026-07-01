create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'contact',
  full_name text not null,
  email text not null,
  program text,
  message text,
  education_level text,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

create policy if not exists "Allow inserts for anonymous users"
  on public.submissions
  for insert
  to anon
  with check (true);

create policy if not exists "Allow reads for authenticated users"
  on public.submissions
  for select
  to authenticated
  using (true);
