-- Extra schema for gamification and preferences (Supabase Postgres)

-- Skips per habit/day
create table
if not exists public.habit_skips
(
  user_id uuid not null references auth.users
(id) on
delete cascade,
  habit_id bigint
not null references public.habits
(id) on
delete cascade,
  day_index int
not null,
  created_at timestamptz default now
(),
  primary key
(habit_id, day_index, user_id)
);

-- Gamification points (per user)
create table
if not exists public.gamification_state
(
  user_id uuid primary key references auth.users
(id) on
delete cascade,
  points int
not null default 0,
  updated_at timestamptz default now
()
);

-- Rewards catalog per user
create table
if not exists public.rewards
(
  id bigserial primary key,
  user_id uuid not null references auth.users
(id) on
delete cascade,
  title text
not null,
  cost int not null,
  claimed_at timestamptz,
  created_at timestamptz default now
()
);

-- Weekly challenges per user
create table
if not exists public.challenges
(
  id bigserial primary key,
  user_id uuid not null references auth.users
(id) on
delete cascade,
  title text
not null,
  week_start date not null,
  target_days int not null,
  completed_at timestamptz,
  created_at timestamptz default now
()
);

-- User preferences (notifications)
create table
if not exists public.user_prefs
(
  user_id uuid primary key references auth.users
(id) on
delete cascade,
  notif_hour int
not null default 20, -- 0..23
  updated_at timestamptz default now
()
);

-- Recommended RLS (enable and add policies matching your existing project)
-- alter table public.habit_skips enable row level security;
-- create policy "own skips" on public.habit_skips for all using (auth.uid() = user_id);
-- Repeat analogous policies for other tables.
