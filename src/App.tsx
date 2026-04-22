import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Section } from './types';
import { useAppData } from './hooks/useAppData';
import { NavBar } from './components/layout/NavBar';
import { BottomNav } from './components/layout/BottomNav';
import { Dashboard } from './components/Dashboard/Dashboard';
import { WeeklyView } from './components/WeeklyView/WeeklyView';
import { HabitTracker } from './components/HabitTracker/HabitTracker';
import { Stats } from './components/Stats/Stats';
import { T } from './theme';

const sectionVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: T.ease } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

function AmbientBlob({ color, top, left, size = 480, opacity = 0.12 }: {
  color: string; top: string; left: string; size?: number; opacity?: number;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(120px)',
        opacity,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

function App() {
  const [section, setSection] = useState<Section>('dashboard');

  const {
    data,
    currentWeekKey,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddHabit,
    handleUpdateHabitName,
    handleDeleteHabit,
    handleToggleHabit,
  } = useAppData();

  const toggleTask = (weekKey: string, taskId: string) => {
    const task = data.weeks[weekKey]?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    handleUpdateTask(weekKey, taskId, { completed: !task.completed });
  };

  const updateTaskText = (weekKey: string, taskId: string, text: string) => {
    handleUpdateTask(weekKey, taskId, { text });
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, position: 'relative', overflow: 'hidden' }}>

      {/* Grid pattern */}
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Ambient blobs */}
      <AmbientBlob color={T.emerald}  top="-10%"  left="60%"  size={600} opacity={0.12} />
      <AmbientBlob color={T.amber}    top="40%"   left="-8%"  size={500} opacity={0.10} />
      <AmbientBlob color={T.aqua}     top="70%"   left="70%"  size={400} opacity={0.08} />

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <NavBar activeSection={section} onSectionChange={setSection} />
      </div>

      {/* Content */}
      <main style={{ position: 'relative', zIndex: 1, paddingBottom: 72 }}>
        <AnimatePresence mode="wait">
          <motion.div key={section} variants={sectionVariants} initial="initial" animate="animate" exit="exit">
            {section === 'dashboard' && (
              <Dashboard data={data} currentWeekKey={currentWeekKey} />
            )}
            {section === 'weekly' && (
              <WeeklyView
                data={data}
                currentWeekKey={currentWeekKey}
                onAddTask={handleAddTask}
                onToggleTask={toggleTask}
                onUpdateTask={updateTaskText}
                onDeleteTask={handleDeleteTask}
              />
            )}
            {section === 'habits' && (
              <HabitTracker
                data={data}
                currentWeekKey={currentWeekKey}
                onAddHabit={handleAddHabit}
                onUpdateHabitName={handleUpdateHabitName}
                onDeleteHabit={handleDeleteHabit}
                onToggleHabit={handleToggleHabit}
              />
            )}
            {section === 'stats' && (
              <Stats data={data} currentWeekKey={currentWeekKey} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <BottomNav activeSection={section} onSectionChange={setSection} />
      </div>
    </div>
  );
}

export default App;
