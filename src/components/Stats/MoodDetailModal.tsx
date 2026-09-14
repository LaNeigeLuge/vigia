import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppData, LifePeriod, PeriodCategory } from '../../types';
import { useTheme } from '../../ThemeContext';
import { useLang } from '../../i18n';
import { useIsMobile, useMediaQuery } from '../../hooks/useMediaQuery';
import { HabitMoodChart } from './HabitCharts';
import { PeriodList } from './PeriodList';
import { categoryColor, ALL_CATEGORIES } from './periodHelpers';

interface MoodDetailModalProps {
  data: AppData;
  onClose: () => void;
  onAddPeriod: (name: string, startDay: string, endDay: string, category: PeriodCategory) => void;
  onUpdatePeriod: (periodId: string, changes: Partial<Pick<LifePeriod, 'name' | 'category'>>) => void;
  onDeletePeriod: (periodId: string) => void;
}

/** Best-effort landscape lock for a legible chart on a phone — most of the web
 *  can't grant this (iOS Safari never does), so failures are swallowed rather
 *  than surfaced; the modal still works fine in portrait, just tighter. */
function useLandscapeOnMobile(isMobile: boolean) {
  useEffect(() => {
    if (!isMobile) return;
    // Both calls are unsupported on plenty of browsers (iOS Safari lacks both
    // outright) — some reject their promise, some throw synchronously instead
    // of returning one at all. try/catch is the only shape that's safe against
    // both failure modes; an optional-chained `?.().catch()` still throws when
    // the call itself returns undefined.
    try { document.documentElement.requestFullscreen?.()?.catch(() => {}); } catch { /* unsupported */ }
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>; unlock?: () => void;
    };
    try { orientation?.lock?.('landscape')?.catch(() => {}); } catch { /* unsupported */ }
    return () => {
      try { orientation?.unlock?.(); } catch { /* unsupported */ }
      if (document.fullscreenElement) {
        try { document.exitFullscreen?.()?.catch(() => {}); } catch { /* unsupported */ }
      }
    };
  }, [isMobile]);
}

function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
}

export function MoodDetailModal({
  data, onClose, onAddPeriod, onUpdatePeriod, onDeletePeriod,
}: Readonly<MoodDetailModalProps>) {
  const { T } = useTheme();
  const { t } = useLang();
  const isMobile = useIsMobile();
  const isPortrait = useMediaQuery('(orientation: portrait)');

  const [addMode, setAddMode] = useState(false);
  const [anchor, setAnchor] = useState<string | null>(null);

  useLandscapeOnMobile(isMobile);
  useBodyScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handlePointClick(dayKey: string) {
    if (!addMode) return;
    if (!anchor) { setAnchor(dayKey); return; }
    const [a, b] = dayKey < anchor ? [dayKey, anchor] : [anchor, dayKey];
    setAnchor(null);
    setAddMode(false);
    const name = window.prompt(t('periods.namePrompt'));
    if (!name || !name.trim()) return;
    onAddPeriod(name.trim(), a, b, 'other');
  }

  function handleRename(period: LifePeriod) {
    const name = window.prompt(t('periods.namePrompt'), period.name);
    if (name && name.trim() && name.trim() !== period.name) onUpdatePeriod(period.id, { name: name.trim() });
  }

  function handleChangeCategory(period: LifePeriod, category: PeriodCategory) {
    onUpdatePeriod(period.id, { category });
  }

  function handleDelete(period: LifePeriod) {
    if (window.confirm(t('periods.deleteConfirm', { name: period.name }))) onDeletePeriod(period.id);
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, background: T.bg, overflowY: 'auto',
      paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: T.emerald }}>
            {t('periods.title')}
          </div>
          <button onClick={onClose} style={closeButton(T.textMuted, T.glassBorder)}>{t('common.close')}</button>
        </div>

        {isMobile && isPortrait && (
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>{t('periods.rotateHint')}</div>
        )}

        <div className="glass" style={{ marginBottom: 12 }}>
          <HabitMoodChart
            data={data} big
            onPointClick={addMode ? handlePointClick : undefined}
            pendingStart={anchor}
            periods={data.lifePeriods}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setAddMode((v) => !v); setAnchor(null); }}
            style={toggleButton(addMode, T.emerald, T.glassBorder, T.textSecondary)}
          >
            {addMode ? t('periods.cancelAdd') : t('periods.addButton')}
          </button>
          {addMode && (
            <span style={{ fontSize: 11, color: T.textMuted }}>
              {anchor ? t('periods.selectEnd') : t('periods.selectStart')}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {ALL_CATEGORIES.map((category) => (
            <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 9, height: 9, borderRadius: 2, flexShrink: 0,
                background: categoryColor(category, T),
              }} />
              <span style={{ fontSize: 10, color: T.textMuted }}>{t(`periods.category.${category}`)}</span>
            </div>
          ))}
        </div>

        <div className="glass" style={{ padding: 10 }}>
          <PeriodList
            periods={data.lifePeriods} moods={data.moods}
            onRename={handleRename} onDelete={handleDelete} onChangeCategory={handleChangeCategory}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function closeButton(color: string, border: string) {
  return {
    background: 'transparent', color, border: `1px solid ${border}`,
    borderRadius: 6, padding: '5px 12px', fontSize: 12,
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' as const,
  };
}

function toggleButton(active: boolean, accent: string, border: string, textSecondary: string) {
  return {
    background: active ? accent : 'transparent',
    color: active ? '#fff' : textSecondary,
    border: `1px solid ${active ? accent : border}`,
    borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' as const,
  };
}
