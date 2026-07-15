import { arrearsStyle, color, font, fontSize, fontWeight, radius, space, unitStatusStyle, type UnitStatusToken } from '../tokens.js';
import { t, type Locale } from '../i18n.js';

export type StatusBadgeProps =
  | { kind: 'unit'; value: UnitStatusToken; locale: Locale }
  | { kind: 'arrears'; daysOverdue: number; locale: Locale };

const base = {
  display: 'inline-block',
  fontFamily: font.sans,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  padding: `${space.s1}px ${space.s2}px`,
  borderRadius: radius.xs,
};

/** The fixed status vocabulary — identical in POS, back office, and reports (DESIGN_SYSTEM.md §2.3). */
export function StatusBadge(props: StatusBadgeProps) {
  if (props.kind === 'unit') {
    const s = unitStatusStyle[props.value];
    return <span style={{ ...base, background: s.bg, color: s.fg }}>{t(props.value, props.locale)}</span>;
  }
  const s = arrearsStyle(props.daysOverdue);
  return (
    <span style={{ ...base, background: s.bg, color: s.fg }}>
      {props.daysOverdue} {t('overdueDays', props.locale)}
    </span>
  );
}

export { color as _statusColors };
