import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section } from './types';
import { useAppData } from './hooks/useAppData';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './ThemeContext';
import { NavBar } from './components/layout/NavBar';
import { BottomNav } from './components/layout/BottomNav';
import { AuthPage } from './components/Auth/AuthPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { WeeklyView } from './components/WeeklyView/WeeklyView';
import { HabitTracker } from './components/HabitTracker/HabitTracker';
import { Stats } from './components/Stats/Stats';

const ease = [0.4, 0, 0.2, 1] as const;
const sectionVariants = {
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
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: 36 }}>🌿</div>
      <div style={{ fontSize: 13, color: T.textMuted, fontFamily: 'DM Sans, sans-serif' }}>
        Loading…
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
  const [section, setSection] = useState<Section>('dashboard');
  const { dark, T } = useTheme();

  const {
    data, loading, error, currentWeekKey,
    handleAddTask, handleUpdateTask, handleDeleteTask,
    handleAddHabit, handleUpdateHabitName, handleDeleteHabit, handleToggleHabit,
    handleSetMood,
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
      style={{ minHeight: '100vh', background: T.bg, color: T.textPrimary, position: 'relative', overflow: 'hidden' }}
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
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
            <div style={{ fontSize: 13, color: T.textMuted, fontFamily: 'DM Sans, sans-serif' }}>Loading your data…</div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{ position: 'fixed', top: 52, left: 0, right: 0, zIndex: 40, background: T.amber, color: '#fff', padding: '10px 20px', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
          ⚠ {error}
        </div>
      )}

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <NavBar activeSection={section} onSectionChange={setSection} userEmail={userEmail} onSignOut={onSignOut} />
      </div>

      {/* Content */}
      <main style={{ position: 'relative', zIndex: 1, paddingBottom: 72 }}>
        <AnimatePresence mode="wait">
          <motion.div key={section} variants={sectionVariants} initial="initial" animate="animate" exit="exit">
            {section === 'dashboard' && <Dashboard data={data} currentWeekKey={currentWeekKey} onSetMood={handleSetMood} />}
            {section === 'weekly' && (
              <WeeklyView
                data={data} currentWeekKey={currentWeekKey}
                onAddTask={handleAddTask} onToggleTask={toggleTask}
                onUpdateTask={updateTaskText} onDeleteTask={handleDeleteTask}
                onAddTodo={handleAddTodo} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo}
              />
            )}
            {section === 'habits' && (
              <HabitTracker
                data={data} currentWeekKey={currentWeekKey}
                onAddHabit={handleAddHabit} onUpdateHabitName={handleUpdateHabitName}
                onDeleteHabit={handleDeleteHabit} onToggleHabit={handleToggleHabit}
              />
            )}
            {section === 'stats' && <Stats data={data} currentWeekKey={currentWeekKey} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile nav */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <BottomNav activeSection={section} onSectionChange={setSection} />
      </div>
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
      <div className="" style={{ background: T.bg, minHeight: '100vh' }}>
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
