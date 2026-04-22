import type { Section } from '../../types';
import { T } from '../../theme';

interface NavBarProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
}

const sections: { id: Section; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'weekly', label: 'Weekly View' },
  { id: 'habits', label: 'Habit Tracker' },
  { id: 'stats', label: 'Stats' },
];

export function NavBar({ activeSection, onSectionChange }: NavBarProps) {
  return (
    <nav
      style={{
        background: 'rgba(10,15,10,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${T.glassBorder}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        height: 52,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 17,
          color: T.emerald,
          marginRight: 32,
          letterSpacing: '-0.3px',
          textShadow: T.glowEm,
          whiteSpace: 'nowrap',
        }}
      >
        Vigia Weekly
      </div>

      {/* Sections */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {sections.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              style={{
                background: isActive ? 'rgba(107,155,127,0.15)' : 'transparent',
                color: isActive ? T.emerald : T.textSecondary,
                border: 'none',
                borderBottom: isActive ? `2px solid ${T.emerald}` : '2px solid transparent',
                padding: '0 18px',
                height: 52,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                letterSpacing: isActive ? '0.02em' : 0,
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                textShadow: isActive ? T.glowEm : 'none',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
