// Seed a demo vigia account with realistic data for README screenshots.
// Usage: node seed.mjs            -> signs up / signs in with anon key
//        SERVICE_KEY=... node seed.mjs  -> uses admin API (auto-confirms email, bypasses RLS)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// ── Load env from project .env ────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(new URL('./.env-vigia', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const URL_ = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SERVICE_KEY || '';

const EMAIL = process.env.DEMO_EMAIL || 'demo@vigia.app';
const PASSWORD = process.env.DEMO_PASSWORD || 'demo-vigia-2026';

// ── Date helpers (Monday-based weeks), anchored to a fixed "today" ────────────
const TODAY = new Date('2026-06-30T12:00:00'); // Tuesday
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
function weekStart(d) { const x = new Date(d); const dow = (x.getDay() + 6) % 7; return addDays(x, -dow); } // Monday
const id = (() => { let n = 0; return () => `seed-${Date.now().toString(36)}-${(n++).toString(36)}`; })();

const curWeek = weekStart(TODAY);
const weeks = [4, 3, 2, 1, 0].map((back) => addDays(curWeek, -7 * back)); // 5 weeks, oldest first

// ── Demo content ──────────────────────────────────────────────────────────────
const TASK_POOL = [
  'Répondre aux emails', 'Réunion équipe', 'Rédiger le rapport', 'Faire les courses',
  'Séance de sport', 'Appeler le médecin', 'Préparer la présentation', 'Réviser le budget',
  'Ranger le bureau', 'Lire un chapitre', 'Planifier la semaine', 'Code review',
  'Déjeuner avec Sarah', 'Payer les factures', 'Sauvegarder les photos', 'Méditer',
];
const HABITS = ['Méditation 10 min', 'Sport', 'Lecture 20 pages', "Boire 2L d'eau", 'Journaling'];
const TODOS = [
  ['Renouveler le passeport', false],
  ["Acheter un cadeau d'anniversaire", false],
  ['Réserver les vacances été', true],
  ['Prendre RDV dentiste', true],
  ['Trier la boîte mail', false],
];
const EMOTIONS = ['heureux','confiant','energise','concentre','inspire','joueur','enjoleur','bien','blase','hebete'];
const SLOTS = ['matin', 'apresmidi', 'soir'];

// deterministic pseudo-random so reruns are stable
let _s = 1234567;
const rand = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function buildData(userId) {
  const tasks = [];
  const habit_logs = [];
  const mood_logs = [];
  const emotional_checkins = [];

  // Tasks: each week, Mon–Fri get 1–3 tasks, older weeks mostly completed,
  // current week partially done (up to today).
  weeks.forEach((ws, wi) => {
    const isCurrent = wi === weeks.length - 1;
    for (let day = 0; day < 7; day++) {
      const d = addDays(ws, day);
      if (isCurrent && d > TODAY) continue;            // no future tasks this week
      if (day >= 5 && rand() > 0.4) continue;          // fewer weekend tasks
      const n = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        const past = d < TODAY;
        const completed = past ? rand() > 0.25 : rand() > 0.7;
        tasks.push({
          id: id(), user_id: userId, text: pick(TASK_POOL),
          completed, day_key: key(d), week_start: key(ws),
        });
      }
    }
  });

  // Habits + logs: build 5 habits with varied adherence, nice streaks.
  const habits = HABITS.map((name, idx) => ({
    id: id(), user_id: userId, name, sort_order: idx,
    created_at: new Date(addDays(weeks[0], -3)).toISOString(),
  }));
  const adherence = [0.85, 0.65, 0.55, 0.9, 0.45]; // per habit
  habits.forEach((h, hi) => {
    // iterate every day from first week start up to today
    for (let d = new Date(weeks[0]); d <= TODAY; d = addDays(d, 1)) {
      // build a current streak for habit 0 and 3 (high adherence) near today
      if (rand() < adherence[hi]) {
        habit_logs.push({ habit_id: h.id, day_key: key(d), user_id: userId });
      }
    }
    // guarantee an unbroken recent streak for the top habits (looks good on dashboard)
    if (hi === 0 || hi === 3) {
      const streakLen = hi === 0 ? 12 : 8;
      for (let s = 0; s < streakLen; s++) {
        const d = addDays(TODAY, -s);
        const k = key(d);
        if (!habit_logs.some((l) => l.habit_id === h.id && l.day_key === k))
          habit_logs.push({ habit_id: h.id, day_key: k, user_id: userId });
      }
    }
  });

  // Moods + emotional checkins: last 21 days.
  for (let s = 0; s < 21; s++) {
    const d = addDays(TODAY, -s);
    const k = key(d);
    mood_logs.push({ user_id: userId, day_key: k, mood: 2 + Math.floor(rand() * 4) }); // 2–5, upbeat
    // emotional check-ins for the last ~10 days, a couple slots each
    if (s < 10) {
      SLOTS.forEach((slot) => {
        if (rand() > 0.45)
          emotional_checkins.push({ user_id: userId, day_key: k, slot, emotion: pick(EMOTIONS) });
      });
    }
  }

  const todos = TODOS.map(([text, completed]) => ({
    id: id(), user_id: userId, text, completed,
    created_at: new Date(addDays(TODAY, -2)).toISOString(),
  }));

  return { tasks, habits, habit_logs, mood_logs, emotional_checkins, todos };
}

// ── Run ────────────────────────────────────────────────────────────────────────
async function main() {
  let userId, client;

  if (SERVICE) {
    const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
    // delete existing demo user (clean reseed)
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === EMAIL);
    if (existing) { await admin.auth.admin.deleteUser(existing.id); console.log('• removed previous demo user'); }
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL, password: PASSWORD, email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    client = admin; // service key bypasses RLS
    console.log('• created demo user (admin):', EMAIL, userId);
  } else {
    client = createClient(URL_, ANON);
    let { data: signIn } = await client.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (!signIn?.session) {
      const { data: signUp, error } = await client.auth.signUp({ email: EMAIL, password: PASSWORD });
      if (error) throw error;
      if (!signUp.session) {
        console.error('\n✗ Sign-up succeeded but NO session returned — email confirmation is ON.');
        console.error('  RLS inserts will fail. Re-run with the service_role key:');
        console.error('    SERVICE_KEY=<service_role_key> node seed.mjs\n');
        process.exit(2);
      }
      signIn = signUp;
      console.log('• signed up:', EMAIL);
    } else {
      console.log('• signed in (account already existed):', EMAIL);
    }
    userId = signIn.session.user.id;

    // wipe any previous demo data so reseeds are clean
    for (const t of ['tasks', 'habit_logs', 'habits', 'todos', 'mood_logs', 'emotional_checkins'])
      await client.from(t).delete().eq('user_id', userId);
  }

  const data = buildData(userId);

  const insert = async (table, rows) => {
    if (!rows.length) return;
    const { error } = await client.from(table).insert(rows);
    if (error) { console.error(`✗ ${table}:`, error.message); throw error; }
    console.log(`  ✓ ${table}: ${rows.length} rows`);
  };

  await insert('habits', data.habits);          // habits before habit_logs (FK)
  await insert('habit_logs', data.habit_logs);
  await insert('tasks', data.tasks);
  await insert('todos', data.todos);
  await insert('mood_logs', data.mood_logs);
  await insert('emotional_checkins', data.emotional_checkins);

  console.log('\n✓ Done. Login:', EMAIL, '/', PASSWORD);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
