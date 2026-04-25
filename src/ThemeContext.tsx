import { createContext, useContext, useState, type ReactNode } from 'react';
import { getT, type ThemeTokens } from './theme';

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
  T: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextValue>(null!);

function loadDark(): boolean {
  try { return localStorage.getItem('vigia-dark') === 'true'; } catch { return false; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(loadDark);

  const toggle = () => setDark((d) => {
    const next = !d;
    try { localStorage.setItem('vigia-dark', String(next)); } catch { /* */ }
    return next;
  });

  return (
    <ThemeContext.Provider value={{ dark, toggle, T: getT(dark) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
