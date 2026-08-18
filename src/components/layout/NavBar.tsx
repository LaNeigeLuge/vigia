import type { Section } from '../../types';
import { useTheme } from '../../ThemeContext';

interface NavBarProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
  userEmail: string;
  onSignOut: () => Promise<void>;
}

const sections: { id: Section; label: string }[] = [
  { id: 'today',     label: "Aujourd'hui" },
  { id: 'dashboard', label: 'Résumé' },
  { id: 'weekly',    label: 'Semaine' },
  { id: 'habits',    label: 'Habitudes' },
  { id: 'stats',     label: 'Stats' },
];

export function NavBar({ activeSection, onSectionChange, userEmail, onSignOut }: Readonly<NavBarProps>) {
  const { dark, toggle, T } = useTheme();

  return (
    <nav
      style={{
        background: T.navBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.glassBorder}`,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: 52,
        boxShadow: T.shadowSm,
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: 16,
          color: T.emerald,
          marginRight: 28,
          letterSpacing: '-0.3px',
          whiteSpace: 'nowrap',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" style={{ flexShrink: 0 }}>
          <rect width="512" height="512" rx="96" fill={T.emerald}/>
          <g transform="translate(256,256) rotate(-45)">
            <rect x="-155" y="-27" width="235" height="54" rx="10" fill="#eee9de"/>
            <rect x="82" y="-20" width="90" height="40" rx="8" fill="#ddd8cc"/>
            <rect x="164" y="-14" width="60" height="28" rx="7" fill="#ccc8bc"/>
            <rect x="218" y="-10" width="18" height="20" rx="5" fill="#b8b4a8"/>
            <rect x="76" y="-29" width="14" height="58" rx="5" fill="#b4b0a4"/>
            <rect x="158" y="-22" width="12" height="44" rx="4" fill="#b4b0a4"/>
            <circle cx="-155" cy="0" r="42" fill={T.emerald}/>
            <circle cx="-155" cy="0" r="34" fill="#6a9e98" opacity="0.9"/>
            <circle cx="-155" cy="0" r="22" fill="#4a7c59" opacity="0.75"/>
            <circle cx="-144" cy="-12" r="9" fill="white" opacity="0.22"/>
            <circle cx="-155" cy="0" r="42" fill="none" stroke="#eee9de" strokeWidth="5"/>
          </g>
        </svg>
        vigia
      </div>

      {/* Sections */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {sections.map((s) => {
          const isActive = activeSection === s.id;
          const activeBg = dark ? 'rgba(107,155,127,0.15)' : 'rgba(74,124,89,0.08)';
          return (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              style={{
                background: isActive ? activeBg : 'transparent',
                color: isActive ? T.emerald : T.textMuted,
                border: 'none',
                borderBottom: isActive ? `2px solid ${T.emerald}` : '2px solid transparent',
                padding: '0 16px',
                height: 52,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                transition: 'all 0.18s ease',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Right side: theme toggle + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 6,
            border: `1.5px solid ${T.emerald}`,
            background: dark ? T.emerald : T.emeraldDark,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 600,
            fontSize: 12,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            boxShadow: dark ? 'none' : '0 1px 4px rgba(74,124,89,0.2)',
          }}
        >
          <span style={{ fontSize: 14 }}>{dark ? '☀' : '☽'}</span>
          {dark ? 'Light' : 'Dark'}
        </button>

        {/* User email */}
        <span style={{
          fontSize: 12,
          color: T.textMuted,
          fontFamily: 'DM Sans, sans-serif',
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {userEmail}
        </span>

        {/* Logout */}
        <button
          onClick={onSignOut}
          title="Sign out"
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: `1px solid ${T.glassBorder}`,
            background: 'transparent',
            color: T.textMuted,
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500,
            fontSize: 12,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
