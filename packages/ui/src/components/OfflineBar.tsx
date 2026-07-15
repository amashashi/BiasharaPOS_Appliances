import { color, font, fontSize, fontWeight, space } from '../tokens.js';
import { t, type Locale } from '../i18n.js';

export interface OfflineBarProps {
  /** Sales/payments waiting in the outbox */
  queued: number;
  /** Sync conflicts needing human resolution */
  conflicts?: number;
  locale: Locale;
}

/** Global connectivity strip: hidden when synced, gold when queued, red when conflicts. */
export function OfflineBar({ queued, conflicts = 0, locale }: OfflineBarProps) {
  if (queued === 0 && conflicts === 0) return null;
  const danger = conflicts > 0;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: space.s2,
        fontFamily: font.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: danger ? color.white : color.amber,
        background: danger ? color.red : color.gold50,
        padding: `${space.s1}px ${space.s4}px`,
      }}
    >
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: danger ? color.white : color.gold }} />
      {danger ? `${conflicts} · ${t('offlineConflicts', locale)}` : `${queued} · ${t('offlineQueued', locale)}`}
    </div>
  );
}
