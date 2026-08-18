import type { Section } from '../../types';
import { useTheme } from '../../ThemeContext';

interface BottomNavProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
}

// Five is the ceiling for a bottom bar — anything more goes to a More menu.
const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'today',     label: "Aujourd'hui", icon: '•' },
  { id: 'dashboard', label: 'Résumé',      icon: '⊞' },
  { id: 'weekly',    label: 'Semaine',     icon: '▦' },
  { id: 'habits',    label: 'Habitudes',   icon: '✓' },
  { id: 'stats',     label: 'Stats',       icon: '↑' },
];

export function BottomNav({ activeSection, onSectionChange }: Readonly<BottomNavProps>) {
  const { T } = useTheme();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: T.navBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${T.glassBorder}`,
        display: 'flex',
        height: 58,
        // Gesture bar / home indicator sits under the bar on notched phones.
        boxSizing: 'content-box',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
              background:  isActive ? T.rowHoverBg : 'transparent',
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
              transition:  'all 0.18s ease',
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
