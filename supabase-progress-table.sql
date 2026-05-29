create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  item_key text not null,
  value jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique (user_id, item_key)
);

alter table progress enable row level security;

drop policy if exists "Users can read their own progress" on progress;
create policy "Users can read their own progress"
on progress for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on progress;
create policy "Users can insert their own progress"
on progress for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on progress;
create policy "Users can update their own progress"
on progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
