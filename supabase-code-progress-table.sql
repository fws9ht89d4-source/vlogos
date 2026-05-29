create table if not exists progress_by_code (
  id uuid primary key default gen_random_uuid(),
  access_code text not null,
  item_key text not null,
  value jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique (access_code, item_key)
);

alter table progress_by_code disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.progress_by_code to anon, authenticated;
