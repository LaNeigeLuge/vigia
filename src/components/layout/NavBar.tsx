import type { Section } from '../../types';
import { useTheme } from '../../ThemeContext';
import { useIsMobile, useIsWide } from '../../hooks/useMediaQuery';
import logoGreen from '../../assets/logo-nav.png';
import logoCream from '../../assets/logo-nav-cream.png';
import logoTex from '../../assets/logo-nav-tex.png';

/**
 * The clay lockup needs height to read: at 26px the sun and the lilac rule turn
 * to mud, and the modelled texture disappears entirely. It holds from 40px, so
 * a pointer screen gets a taller bar and the textured mark, while a phone keeps
 * the flat monochrome one that stays crisp small.
 */
const NAV_H   = { mobile: 52, pointer: 64 };
const LOGO_H  = { mobile: 26, pointer: 44 };

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
  const isWide = useIsWide();
  const isMobile = useIsMobile();
  // Wide screens render the summary beside Today, so it has no page of its own.
  const items = isWide ? sections.filter((s) => s.id !== 'dashboard') : sections;

  const navH  = isMobile ? NAV_H.mobile  : NAV_H.pointer;
  const logoH = isMobile ? LOGO_H.mobile : LOGO_H.pointer;
  let logoSrc = logoTex;
  if (isMobile) logoSrc = dark ? logoCream : logoGreen;

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
        height: navH,
        boxShadow: T.shadowSm,
      }}
    >
      {/* Brand — the real wordmark lockup, replacing a hand-drawn placeholder.
          Cream on dark: the green mark only reaches 3.9:1 on the dark navbar,
          and the brand sheet ships a cream variant for exactly this case. */}
      <img
        src={logoSrc}
        alt="vigia"
        style={{ height: logoH, width: 'auto', display: 'block', marginRight: 28, flexShrink: 0 }}
      />

      {/* Sections */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {items.map((s) => {
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
                height: navH,
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
            boxShadow: dark
              ? '0 2px 6px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.22)'
              : '0 2px 6px rgba(45,90,61,0.32), inset 0 1px 0 rgba(255,255,255,0.28)',
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
