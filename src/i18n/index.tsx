import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { fr as frLocale, enGB } from 'date-fns/locale';
import { en, fr, interpolate, type StringKey } from './strings';
import { getWeekDays } from '../utils/dateUtils';

export type Lang = 'en' | 'fr';

/**
 * Dates are the other half of a translation: a dictionary alone still renders
 * "lun." under an English header. These wrappers are handed out already bound to
 * the current locale, which is why components call `d.dayLabel(day)` rather than
 * a bare util — there is no way to forget the locale argument.
 *
 * en-GB rather than en-US: the app writes 21 August, not August 21, and its
 * weeks start on Monday. That Monday is a data invariant, not a locale choice —
 * every week is keyed by its Monday in the database, so `getWeekStart` stays
 * fixed even for a locale that would otherwise start on Sunday.
 */
interface Dates {
  dayLabel: (date: Date) => string;
  monthLabel: (date: Date) => string;
  weekdayLabel: (date: Date) => string;
  monthYearLabel: (date: Date) => string;
  weekLabel: (weekStart: Date) => string;
}

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
  /** `{name}`-style placeholders are filled from `vars`. */
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  d: Dates;
}

const LangContext = createContext<LangContextValue>(null!);

const DICTS = { en, fr };
const LOCALES = { en: enGB, fr: frLocale };

function loadLang(): Lang {
  try {
    return localStorage.getItem('vigia-lang') === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(loadLang);

  const toggle = () => setLang((l) => {
    const next: Lang = l === 'en' ? 'fr' : 'en';
    try { localStorage.setItem('vigia-lang', next); } catch { /* private mode */ }
    return next;
  });

  // The one bit of language state outside React's tree — screen readers take
  // their pronunciation from it. An effect rather than a line in `toggle`, so a
  // stored French preference is applied on first paint too, not only on a click.
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Memoised on the language, so `t` and `d` are stable identities between
  // renders. Consumers put them straight into useMemo dependency arrays; a fresh
  // object every render would silently defeat every one of those memos.
  const { t, d } = useMemo(() => {
    const dict = DICTS[lang];
    const locale = LOCALES[lang];

    const translate = (key: StringKey, vars?: Record<string, string | number>) =>
      interpolate(dict[key], vars);

    const dates: Dates = {
      dayLabel: (date) => format(date, 'EEE', { locale }),
      monthLabel: (date) => format(date, 'MMM', { locale }),
      weekdayLabel: (date) => format(date, 'EEEE', { locale }),
      monthYearLabel: (date) => format(date, 'MMMM yyyy', { locale }),
      weekLabel: (weekStart) => translate('week.range', {
        from: format(weekStart, 'd MMMM', { locale }),
        to: format(getWeekDays(weekStart)[6], 'd MMMM yyyy', { locale }),
      }),
    };

    return { t: translate, d: dates };
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, toggle, t, d }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
