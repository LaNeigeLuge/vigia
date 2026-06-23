# vigia

Personal productivity app. Weekly task planner, habit tracker, mood logging, and emotional check-ins — all in a single mobile-first PWA backed by Supabase.

Data lives in PostgreSQL, scoped per user via Row Level Security. The frontend is a static build deployed to Vercel. No server code; the client talks directly to Supabase.

## Stack

| Layer     | Tech                                 |
| --------- | ------------------------------------ |
| Frontend  | React 19, TypeScript 6, Vite 8       |
| Styling   | Tailwind CSS v4, Framer Motion       |
| Charts    | Recharts                             |
| Backend   | Supabase (Auth + PostgreSQL + RLS)   |
| PWA       | vite-plugin-pwa (Workbox, autoUpdate)|
| Utilities | date-fns, canvas-confetti            |

## Features

**Dashboard** — week-at-a-glance view with a donut chart for weekly task progress, a bar chart for daily completions, habit streaks with progress bars, and a daily quote.

**Mood tracking** — daily mood score (1 to 5) with scrollable history. Supports editing past entries.

**Emotional check-ins** — three time slots per day (morning, afternoon, night), each rendered as a 16-segment color wheel mapped to a set of emotions. After selection, the wheel collapses to a confirmed circle showing the chosen emotion; click to re-select. Supports today and yesterday.

**Weekly planner** — task list organized by day within a week. Navigate to past weeks for review or retroactive edits.

**Habit tracker** — daily checkbox grid with streak counting. Week navigation with full edit access on past weeks. GitHub-style contribution heatmap in the stats view.

**Stats** — all-time KPIs (total tasks completed, best week, longest habit streak), habit consistency heatmap with mood overlay, and a dual-axis chart correlating habit completion rate with daily mood.

**Theming** — dark and light modes with a shared token palette (emerald, amber, sage, aqua). Toggle persisted in local state.

**PWA** — installable on mobile, offline-capable via Workbox service worker with network-first caching for Supabase API calls.

## Architecture

```text
src/
  App.tsx                  Auth gate + section routing
  ThemeContext.tsx          Dark/light theme provider
  theme.ts                 Token definitions (colors, shadows)
  components/
    Auth/                  Sign-in / sign-up page
    Dashboard/             Dashboard, MoodPicker, EmotionalCheckIn
    WeeklyView/            Weekly task planner
    HabitTracker/          Habit grid with week navigation
    Stats/                 KPIs, HabitHeatmap, HabitCharts
    layout/                NavBar, BottomNav
    ui/                    DonutChart, ProgressBar
  hooks/
    useAppData.ts          Central state + optimistic DB writes
    useAuth.ts             Supabase auth session management
  lib/
    db.ts                  Supabase query layer (all CRUD)
    supabase.ts            Supabase client init
  types/
    index.ts               Shared type definitions
  utils/
    dataUtils.ts           Pure helpers (streaks, completion rates, quotes)
    dateUtils.ts           Date formatting and week math
supabase/
  schema.sql               Full DDL with RLS policies
```

### Data model

| Type           | Fields                                      |
| -------------- | ------------------------------------------- |
| `Task`         | id, text, completed, dayKey, weekStart      |
| `Habit`        | id, name, completions (day map), createdAt  |
| `Todo`         | id, text, completed, createdAt              |
| `MoodValue`    | 1 through 5                                 |
| `EmotionSlot`  | matin, apresmidi, soir                      |
| `EmotionId`    | 16 values (heureux, confiant, triste, ...)  |

### Database

Six tables in Supabase, all with RLS enforcing `auth.uid() = user_id`:

`tasks`, `habits`, `habit_logs`, `todos`, `mood_logs`, `emotional_checkins`

Writes are optimistic: local state updates immediately, then the DB call fires in the background. Errors are logged to console.

## Setup

Clone and install:

```bash
git clone https://github.com/LaNeigeLuge/vigia.git
cd vigia
npm install
```

Configure Supabase credentials:

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

Apply the database schema. In your Supabase project SQL Editor, run the contents of `supabase/schema.sql`, then add the emotional check-ins table:

```sql
create table if not exists emotional_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key date not null,
  slot text not null check (slot in ('matin', 'apresmidi', 'soir')),
  emotion text not null,
  primary key (user_id, day_key, slot)
);

alter table emotional_checkins enable row level security;

create policy "emotional_checkins: own data only"
  on emotional_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Deployment

The production build is a static site. Deploy to any static host (Vercel, Netlify, Cloudflare Pages). Set the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your hosting provider.

The Vercel build command is `npm run build` with the output directory `dist`.

## License

Private project. Not published under an open-source license.
