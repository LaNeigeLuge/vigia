import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Section } from './types';
import { useAppData } from './hooks/useAppData';
import { useIsMobile, useIsWide } from './hooks/useMediaQuery';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './ThemeContext';
import { NavBar } from './components/layout/NavBar';
import { BottomNav } from './components/layout/BottomNav';
import { AuthPage } from './components/Auth/AuthPage';
import { Today } from './components/Today/Today';
import logoLoad from './assets/logo-load.png';
import { Dashboard } from './components/Dashboard/Dashboard';
import { WeeklyView } from './components/WeeklyView/WeeklyView';
import { HabitTracker } from './components/HabitTracker/HabitTracker';
import { Stats } from './components/Stats/Stats';

const ease = [0.4, 0, 0.2, 1] as const;

/**
 * The CSS reset in index.css only reaches CSS transitions and keyframes —
 * Framer Motion drives inline transforms from JS and needs asking directly.
 * Reduced motion keeps the crossfade and drops the travel: the spatial cue goes,
 * the state change is still visible.
 */
const sectionVariants = (still: boolean) => still ? {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.01 } },
  exit:    { opacity: 0, transition: { duration: 0.01 } },
} : {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function AmbientBlob({ color, top, left, size = 480, opacity = 0.1 }: Readonly<{
  color: string; top: string; left: string; size?: number; opacity?: number;
}>) {
  return (
    <div style={{
      position: 'fixed', top, left, width: size, height: size,
      borderRadius: '50%', background: color,
      filter: 'blur(120px)', opacity, pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  const { T } = useTheme();
  return (
    <div style={{
      minHeight: '100dvh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12,
    }}>
      <img
        src={logoLoad}
        alt="vigia"
        className="logo-breathe"
        style={{ width: 240, maxWidth: '70vw', height: 'auto' }}
      />
      <div style={{ fontSize: 13, color: T.textMuted, fontFamily: 'DM Sans, sans-serif' }}>
        Chargement…
      </div>
    </div>
  );
}

// ─── Main app (authenticated) ─────────────────────────────────────────────────

interface AppInnerProps {
  userId:    string;
  userEmail: string;
  onSignOut: () => Promise<void>;
}

function AppInner({ userId, userEmail, onSignOut }: Readonly<AppInnerProps>) {
  const [section, setSection] = useState<Section>('today');
  const { dark, T } = useTheme();
  const isWide = useIsWide();
  const isMobile = useIsMobile();
  const still = useReducedMotion() ?? false;

  // Wide screens show Today and the summary together, so 'dashboard' has no
  // destination of its own. Folded at render time rather than synced in an
  // effect, so resizing never costs a second render to correct itself.
  const activeSection: Section = isWide && section === 'dashboard' ? 'today' : section;

  const {
    data, loading, error, currentWeekKey,
    handleAddTask, handleUpdateTask, handleDeleteTask, handleMigrateTask,
    handleAddHabit, handleUpdateHabitName, handleDeleteHabit, handleToggleHabit,
    handleSetMood, handleSetCheckin,
    handleAddTodo, handleToggleTodo, handleDeleteTodo,
  } = useAppData(userId);

  const toggleTask = (weekKey: string, taskId: string) => {
    const task = data.weeks[weekKey]?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    handleUpdateTask(weekKey, taskId, { completed: !task.completed });
  };

  const updateTaskText = (weekKey: string, taskId: string, text: string) => {
    handleUpdateTask(weekKey, taskId, { text });
  };

  return (
    <div
      className={dark ? 'dark' : ''}
      style={{
        minHeight: '100dvh', background: T.bg, color: T.textPrimary,
        position: 'relative', overflow: 'hidden',
        // Landscape on a notched phone eats the left/right edges.
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Grid */}
      <div className={dark ? 'bg-grid-dark' : 'bg-grid-light'} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Blobs — dark mode only */}
      {dark && (
        <>
          <AmbientBlob color="#4a7c59" top="-10%" left="60%" size={600} opacity={0.10} />
          <AmbientBlob color="#b07d52" top="40%"  left="-8%" size={500} opacity={0.08} />
          <AmbientBlob color="#6a9e98" top="70%"  left="70%" size={400} opacity={0.06} />
        </>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={logoLoad}
              alt="vigia"
              className="logo-breathe"
              style={{ width: 210, maxWidth: '65vw', height: 'auto', marginBottom: 14 }}
            />
            <div style={{ fontSize: 13, color: T.textMuted, fontFamily: 'DM Sans, sans-serif' }}>Chargement de tes données…</div>
          </div>
        </div>
      )}

      {/* Error banner — sits right under the bar, whose height changes with the
          breakpoint, so the offset has to follow it. */}
      {error && (
        <div style={{ position: 'fixed', top: isMobile ? 52 : 64, left: 0, right: 0, zIndex: 40, background: T.amber, color: '#fff', padding: '10px 20px', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
          ⚠ {error}
        </div>
      )}

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <NavBar activeSection={activeSection} onSectionChange={setSection} userEmail={userEmail} onSignOut={onSignOut} />
      </div>

      {/* Content — only reserve room for the bottom bar where it exists.
          58px nav + 14px breathing room + whatever the gesture bar takes. */}
      <main style={{
        position: 'relative', zIndex: 1,
        paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : 24,
      }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} variants={sectionVariants(still)} initial="initial" animate="animate" exit="exit">
            {activeSection === 'today' && (
              <div style={{
                display: isWide ? 'grid' : 'block',
                // clamp, not minmax: minmax hands the left column its maximum as
                // soon as there's slack, which starves the right one and makes
                // the three emotion rings wrap. This keeps the log at 480 when
                // space is tight and lets it grow only once the summary is served.
                gridTemplateColumns: isWide ? 'clamp(480px, 32%, 620px) minmax(0, 1fr)' : undefined,
                gap: isWide ? 16 : undefined,
                maxWidth: isWide ? 1480 : undefined,
                margin: isWide ? '0 auto' : undefined,
                padding: isWide ? '0 16px' : undefined,
                alignItems: 'start',
              }}>
                {/* Both children are wrapped: Today and Dashboard each centre
                    themselves with `margin: 0 auto`, and an auto inline margin
                    on a grid item cancels the default stretch — the box would
                    shrink to its content instead of filling the column. */}
                <div>
                  <Today
                    data={data}
                    onAddTask={handleAddTask} onToggleTask={toggleTask}
                    onUpdateTask={updateTaskText} onDeleteTask={handleDeleteTask}
                    onMigrateTask={handleMigrateTask} onToggleHabit={handleToggleHabit}
                  />
                </div>
                {isWide && (
                  <div>
                    <Dashboard data={data} currentWeekKey={currentWeekKey} onSetMood={handleSetMood} onSetCheckin={handleSetCheckin} />
                  </div>
                )}
              </div>
            )}
            {activeSection === 'dashboard' && <Dashboard data={data} currentWeekKey={currentWeekKey} onSetMood={handleSetMood} onSetCheckin={handleSetCheckin} />}
            {activeSection === 'weekly' && (
              <WeeklyView
                data={data} currentWeekKey={currentWeekKey}
                onAddTask={handleAddTask} onToggleTask={toggleTask}
                onUpdateTask={updateTaskText} onDeleteTask={handleDeleteTask}
                onAddTodo={handleAddTodo} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo}
              />
            )}
            {activeSection === 'habits' && (
              <HabitTracker
                data={data} currentWeekKey={currentWeekKey}
                onAddHabit={handleAddHabit} onUpdateHabitName={handleUpdateHabitName}
                onDeleteHabit={handleDeleteHabit} onToggleHabit={handleToggleHabit}
              />
            )}
            {activeSection === 'stats' && <Stats data={data} currentWeekKey={currentWeekKey} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile nav — the top bar already covers every section above 767px, and
          showing both stacked two navigations at the same hierarchy level. */}
      {isMobile && (
        <div style={{ position: 'relative', zIndex: 10 }}>
          <BottomNav activeSection={activeSection} onSectionChange={setSection} />
        </div>
      )}
    </div>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { T } = useTheme();
  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();

  if (authLoading) return <LoadingScreen />;

  if (!session) {
    return (
      <div className="" style={{ background: T.bg, minHeight: '100dvh' }}>
        <AuthPage onSignIn={signIn} onSignUp={signUp} />
      </div>
    );
  }

  return (
    <AppInner
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
      onSignOut={signOut}
    />
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider>
      <AuthGate />
    </ThemeProvider>
  );
}

export default App;
