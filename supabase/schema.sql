-- Run this in the Supabase SQL Editor (SQL Editor > New query > paste > Run).

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  due_date    date,
  status      text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at  timestamptz not null default now()
);

-- Row Level Security: each user can only touch their own rows.
alter table public.tasks enable row level security;

create policy "Users can read their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can add their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);
