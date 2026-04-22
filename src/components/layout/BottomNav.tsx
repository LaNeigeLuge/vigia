import type { Section } from '../../types';
import { T } from '../../theme';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
}

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'weekly',    label: 'Week',      icon: '▦' },
  { id: 'habits',    label: 'Habits',    icon: '✓' },
  { id: 'stats',     label: 'Stats',     icon: '↑' },
];

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'rgba(10,15,10,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: `1px solid ${T.glassBorder}`,
        display: 'flex',
        height: 58,
        zIndex: 100,
      }}
    >
      {sections.map((s) => {
        const isActive = activeSection === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSectionChange(s.id)}
            style={{
              flex: 1,
              background:  isActive ? 'rgba(107,155,127,0.12)' : 'transparent',
              color:       isActive ? T.emerald : T.textMuted,
              border:      'none',
              borderTop:   isActive ? `2px solid ${T.emerald}` : '2px solid transparent',
              cursor:      'pointer',
              display:     'flex',
              flexDirection: 'column',
              alignItems:  'center',
              justifyContent: 'center',
              gap: 3,
              fontSize:    10,
              fontFamily:  'DM Sans, sans-serif',
              fontWeight:  isActive ? 600 : 400,
              transition:  'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              textShadow:  isActive ? T.glowEm : 'none',
            }}
          >
            <span style={{ fontSize: 17 }}>{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
