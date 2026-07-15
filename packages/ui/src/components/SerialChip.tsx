import { color, font, fontSize, fontWeight, radius, space, border } from '../tokens.js';
import { t, type Locale } from '../i18n.js';

export interface SerialChipProps {
  serial: string;
  locale: Locale;
  onLookup?: (serial: string) => void;
}

/** Serial number pill — mono-feel tabular digits, tap to look up, copy affordance. */
export function SerialChip({ serial, locale, onLookup }: SerialChipProps) {
  return (
    <span
      role={onLookup ? 'button' : undefined}
      onClick={onLookup ? () => onLookup(serial) : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.s1,
        fontFamily: font.mono,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        fontVariantNumeric: 'tabular-nums',
        color: color.steel,
        background: color.steelTint,
        border: `${border.hair}px solid ${color.line}`,
        borderRadius: radius.pill,
        padding: `${space.s1}px ${space.s3}px`,
        cursor: onLookup ? 'pointer' : 'default',
      }}
    >
      {serial}
      <button
        aria-label={t('copySerial', locale)}
        title={t('copySerial', locale)}
        onClick={(e) => {
          e.stopPropagation();
          void navigator.clipboard?.writeText(serial);
        }}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: color.steel, padding: 0, fontSize: fontSize.sm }}
      >
        ⧉
      </button>
    </span>
  );
}
