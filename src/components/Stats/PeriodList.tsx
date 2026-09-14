import { useState } from 'react';
import type { LifePeriod, MoodValue, PeriodCategory } from '../../types';
import { useTheme } from '../../ThemeContext';
import { useLang } from '../../i18n';
import type { ThemeTokens } from '../../theme';
import { periodColor, categoryColor, averageMood, ALL_CATEGORIES } from './periodHelpers';

interface PeriodListProps {
  periods: LifePeriod[];
  moods: Record<string, MoodValue>;
  onRename: (period: LifePeriod) => void;
  onDelete: (period: LifePeriod) => void;
  onChangeCategory: (period: LifePeriod, category: PeriodCategory) => void;
}

/** Periods themselves are annotated directly on the mood chart (see
 *  HabitMoodChart's `periods` prop) — this is just the management list:
 *  rename, delete, and the average mood a chart bracket can't show. */
export function PeriodList({ periods, moods, onRename, onDelete, onChangeCategory }: Readonly<PeriodListProps>) {
  const { T } = useTheme();
  const { t } = useLang();
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  if (periods.length === 0) {
    return (
      <div style={{ color: T.textMuted, textAlign: 'center', padding: '16px 8px', fontSize: 12 }}>
        {t('periods.empty')}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[...periods].sort((a, b) => a.startDay.localeCompare(b.startDay)).map((p) => {
        const avg = averageMood(p, moods);
        return (
          <div key={p.id} style={{
            padding: '6px 8px', borderRadius: 6, background: T.rowHoverBg,
            fontSize: 11, fontFamily: 'DM Sans, sans-serif',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setPickerFor((id) => (id === p.id ? null : p.id))}
                title={t('periods.changeCategoryHint')}
                style={{
                  width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                  background: periodColor(p, T), border: 'none', padding: 0, cursor: 'pointer',
                }}
              />
              <span style={{ flex: 1, color: T.textPrimary, fontWeight: 600 }}>{p.name}</span>
              <span style={{ color: T.textMuted, fontSize: 10 }}>{t(`periods.category.${p.category}`)}</span>
              <span style={{ color: T.textMuted, fontSize: 10 }}>{p.startDay} → {p.endDay}</span>
              {avg != null && (
                <span style={{ color: T.textMuted, fontSize: 10 }}>· {t('periods.avgMood', { v: avg })}</span>
              )}
              <button onClick={() => onRename(p)} style={pillButton(T)}>{t('common.rename')}</button>
              <button onClick={() => onDelete(p)} style={pillButton(T)}>{t('common.delete')}</button>
            </div>
            {pickerFor === p.id && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: 22 }}>
                {ALL_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => { onChangeCategory(p, category); setPickerFor(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: category === p.category ? T.checkedCellBg : 'transparent',
                      border: `1px solid ${T.glassBorder}`, borderRadius: 4,
                      padding: '3px 7px', fontSize: 10, fontFamily: 'DM Sans, sans-serif',
                      color: T.textSecondary, cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: categoryColor(category, T) }} />
                    {t(`periods.category.${category}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function pillButton(T: ThemeTokens) {
  return {
    background: 'transparent', color: T.textMuted, border: `1px solid ${T.glassBorder}`,
    borderRadius: 4, padding: '2px 7px', fontSize: 10, fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer' as const,
  };
}
