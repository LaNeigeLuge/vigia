-- vigia — Supabase schema (with Auth + RLS)
-- ⚠️  Drop existing tables first if you already ran the previous schema:
--     drop table if exists habit_logs, habits, tasks cascade;

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists tasks (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  text        text        not null,
  completed   boolean     not null default false,
  day_key     date        not null,
  week_start  date        not null,
  created_at  timestamptz not null default now()
);

-- Bullet-journal migration: the day this task was moved to. The row keeps its
-- original day_key so the `>` trace stays readable on the day it left.
alter table tasks add column if not exists migrated_to date;

create table if not exists habits (
  id          text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists habit_logs (
  habit_id    text    not null references habits(id) on delete cascade,
  day_key     date    not null,
  user_id     uuid    not null references auth.users(id) on delete cascade,
  primary key (habit_id, day_key)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists tasks_user_week_idx   on tasks(user_id, week_start);
create index if not exists habits_user_idx        on habits(user_id);
create index if not exists habit_logs_habit_idx   on habit_logs(habit_id);
create index if not exists habit_logs_user_idx    on habit_logs(user_id);

create table if not exists todos (
  id         text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  text       text        not null,
  completed  boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_idx on todos(user_id);

create table if not exists mood_logs (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  day_key    date   not null,
  mood       int    not null check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create index if not exists mood_logs_user_idx on mood_logs(user_id);

create table if not exists emotional_checkins (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  day_key    date        not null,
  slot       text        not null,
  emotion    text        not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day_key, slot)
);

create index if not exists emotional_checkins_user_idx on emotional_checkins(user_id);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table tasks              enable row level security;
alter table habits             enable row level security;
alter table habit_logs         enable row level security;
alter table todos              enable row level security;
alter table mood_logs          enable row level security;
alter table emotional_checkins enable row level security;

-- Tasks: each user sees and writes only their own rows
create policy "tasks: own data only"
  on tasks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habits: same
create policy "habits: own data only"
  on habits for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habit logs: same
create policy "habit_logs: own data only"
  on habit_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Todos: same
create policy "todos: own data only"
  on todos for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mood logs: same
create policy "mood_logs: own data only"
  on mood_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Emotional check-ins: same
create policy "emotional_checkins: own data only"
  on emotional_checkins for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
