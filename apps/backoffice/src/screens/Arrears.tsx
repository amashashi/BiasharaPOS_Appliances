import { useEffect, useState } from 'react';
import {
  Button, MoneyDisplay, StatusBadge, color, font, fontSize, fontWeight, formatDate, formatDateTime,
  radius, space, type Locale,
} from '@biashara/ui';
import {
  fetchAgreement, fetchArrears,
  type AgreementDetail, type ArrearsRow, type ReminderView, type ScheduleRowView, type Session,
} from '../api.js';

const S = {
  daysOverdue: { sw: 'Siku za ucheleweshaji', en: 'Days overdue' },
  amount: { sw: 'Kiasi', en: 'Amount' },
  arrears: { sw: 'Madeni yaliyochelewa', en: 'Arrears' },
  customer: { sw: 'Mteja', en: 'Customer' },
  order: { sw: 'Oda', en: 'Order' },
  balance: { sw: 'Salio la mkataba', en: 'Schedule balance' },
  nextDue: { sw: 'Malipo yajayo', en: 'Next due' },
  asOf: { sw: 'Kufikia tarehe', en: 'As of' },
  sortBy: { sw: 'Panga kwa', en: 'Sort by' },
  none: { sw: 'Hakuna mteja aliyechelewa 🎉', en: 'No one is behind on payments 🎉' },
  totalOwed: { sw: 'Jumla ya madeni', en: 'Total arrears' },
  agreements: { sw: 'mikataba', en: 'agreements' },
  back: { sw: '← Rudi', en: '← Back' },
  agreement: { sw: 'Mkataba wa mkopo', en: 'Credit agreement' },
  schedule: { sw: 'Ratiba ya malipo', en: 'Payment schedule' },
  due: { sw: 'Tarehe', en: 'Due' },
  paid: { sw: 'Imelipwa', en: 'Paid' },
  state: { sw: 'Hali', en: 'Status' },
  principal: { sw: 'Thamani', en: 'Principal' },
  deposit: { sw: 'Amana', en: 'Deposit' },
  financed: { sw: 'Inayodaiwa', en: 'Financed' },
  remindersTitle: { sw: 'Kumbukumbu za ukumbusho (SMS)', en: 'Reminder log (SMS)' },
  noReminders: { sw: 'Hakuna ukumbusho uliotumwa bado', en: 'No reminders sent yet' },
  sentTo: { sw: 'Kwenda', en: 'To' },
  when: { sw: 'Wakati', en: 'When' },
  dueDay: { sw: 'Siku ya malipo', en: 'Due day' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const cell: React.CSSProperties = {
  padding: `${space.s2}px ${space.s3}px`,
  textAlign: 'left',
  fontSize: fontSize.body,
  borderBottom: `1px solid ${color.line}`,
};
/** §3: table headers are the eyebrow treatment — xs, 800, letterspaced caps. */
const headerCell: React.CSSProperties = {
  ...cell,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: color.ink2,
};
const input: React.CSSProperties = {
  minHeight: 40,
  padding: `${space.s1}px ${space.s2}px`,
  fontFamily: font.sans,
  fontSize: fontSize.body,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.xs,
};

/** Arrears dashboard (T3.3) + agreement drill-down with reminder log (T3.4). */
export function Arrears({ session, locale }: { session: Session; locale: Locale }) {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [sort, setSort] = useState<'days' | 'amount'>('days');
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchArrears>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchArrears(session, asOf, sort)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [session, asOf, sort]);

  if (detailOrderId) {
    return (
      <AgreementView
        session={session}
        locale={locale}
        orderId={detailOrderId}
        onBack={() => setDetailOrderId(null)}
      />
    );
  }

  return (
    <div style={{ padding: space.s4, maxWidth: 980, fontFamily: font.sans }}>
      <h2 style={{ margin: `0 0 ${space.s3}px`, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>
        {t('arrears', locale)}
      </h2>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: space.s4, marginBottom: space.s4, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
          {t('asOf', locale)}
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} style={input} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: space.s1, fontSize: fontSize.sm, color: color.ink2 }}>
          {t('sortBy', locale)}
          <select value={sort} onChange={(e) => setSort(e.target.value as 'days' | 'amount')} style={input}>
            <option value="days">{t('daysOverdue', locale)}</option>
            <option value="amount">{t('amount', locale)}</option>
          </select>
        </label>
        {data && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{t('totalOwed', locale)}</div>
            <MoneyDisplay amountTzs={data.totals.arrearsTzs} variant="negative" size={22} />
            <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>
              {data.totals.agreements} {t('agreements', locale)}
            </div>
          </div>
        )}
      </div>

      {error && <div style={{ color: color.red, marginBottom: space.s3 }}>{error}</div>}

      {data && data.items.length === 0 && (
        <div style={{ padding: space.s6, textAlign: 'center', color: color.ink3, fontSize: fontSize.lead }}>
          {t('none', locale)}
        </div>
      )}

      {data && data.items.length > 0 && (
        <div style={{ background: color.surface, borderRadius: radius.md, border: `1px solid ${color.line}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: color.tint }}>
                <th style={headerCell}>{t('customer', locale)}</th>
                <th style={headerCell}>{t('order', locale)}</th>
                <th style={{ ...headerCell, textAlign: 'right' }}>{t('daysOverdue', locale)}</th>
                <th style={{ ...headerCell, textAlign: 'right' }}>{t('arrears', locale)}</th>
                <th style={{ ...headerCell, textAlign: 'right' }}>{t('balance', locale)}</th>
                <th style={headerCell}>{t('nextDue', locale)}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row: ArrearsRow) => (
                <tr
                  key={row.agreementId}
                  onClick={() => setDetailOrderId(row.orderId)}
                  style={{ cursor: 'pointer' }}
                  title={locale === 'sw' ? 'Fungua mkataba' : 'Open agreement'}
                >
                  <td style={cell}>
                    <div style={{ fontWeight: fontWeight.semibold }}>{row.customer.name}</div>
                    <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{row.customer.phone ?? ''}</div>
                  </td>
                  <td style={{ ...cell, color: color.ink2 }}>
                    SO-{String(row.orderNumber).padStart(6, '0')}
                    <span style={{ marginLeft: space.s2, fontSize: fontSize.xs, color: color.steel, fontWeight: fontWeight.semibold, letterSpacing: '0.06em' }}>
                      {row.type}
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <StatusBadge kind="arrears" daysOverdue={row.daysOverdue} locale={locale} />
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <MoneyDisplay amountTzs={row.arrearsTzs} variant="negative" />
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <MoneyDisplay amountTzs={row.scheduleBalanceTzs} variant="muted" />
                  </td>
                  <td style={{ ...cell, color: color.ink2 }}>{row.nextDueDate ? formatDate(row.nextDueDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** §2.3-semantic pills for schedule-row and reminder statuses. */
const pill = (bg: string, fg: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: `${space.s1}px ${space.s2}px`,
  borderRadius: radius.xs,
  background: bg,
  color: fg,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
});
const rowPill: Record<ScheduleRowView['status'], React.CSSProperties> = {
  PAID: pill(color.green50, color.greenD),
  PARTIAL: pill(color.gold50, color.amber),
  OVERDUE: pill(color.red50, color.red),
  PENDING: pill(color.tint, color.ink2),
};
const reminderPill: Record<ReminderView['status'], React.CSSProperties> = {
  SENT: pill(color.green50, color.greenD),
  FAILED: pill(color.red50, color.red),
  PENDING: pill(color.gold50, color.amber),
};

const offsetLabel = (o: number, locale: Locale): string =>
  o < 0 ? `T${o}` : o === 0 ? t('dueDay', locale) : `+${o}`;

/** Agreement drill-down (T3.4 verify: schedule + reminder log on one screen). */
function AgreementView({
  session, locale, orderId, onBack,
}: {
  session: Session;
  locale: Locale;
  orderId: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<AgreementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgreement(session, orderId)
      .then((d) => setDetail(d))
      .catch((e: Error) => setError(e.message));
  }, [session, orderId]);

  return (
    <div style={{ padding: space.s4, maxWidth: 900, fontFamily: font.sans }}>
      <Button variant="ghost" onClick={onBack} style={{ marginBottom: space.s2, paddingLeft: 0 }}>
        {t('back', locale)}
      </Button>
      {error && <div style={{ color: color.red }}>{error}</div>}
      {detail && (
        <>
          <h2 style={{ margin: `0 0 ${space.s1}px`, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>
            {t('agreement', locale)} · {detail.customer.name}
          </h2>
          <div style={{ color: color.ink3, fontSize: fontSize.sm, marginBottom: space.s3 }}>
            <span style={{ color: color.steel, fontWeight: fontWeight.semibold, letterSpacing: '0.06em' }}>{detail.type}</span>
            {' · '}{detail.status}{detail.customer.phone ? ` · ${detail.customer.phone}` : ''}
          </div>

          <div style={{ display: 'flex', gap: space.s4, marginBottom: space.s4, flexWrap: 'wrap' }}>
            {([
              [t('principal', locale), detail.principalTzs, 'default'],
              [t('deposit', locale), detail.depositTzs, 'muted'],
              [t('financed', locale), detail.financedTzs, 'positive'],
            ] as const).map(([label, amount, variant]) => (
              <div key={label} style={{ background: color.surface, border: `1px solid ${color.line}`, borderRadius: radius.md, padding: space.s3, minWidth: 160 }}>
                <div style={{ fontSize: fontSize.sm, color: color.ink3 }}>{label}</div>
                <MoneyDisplay amountTzs={amount} variant={variant} size={20} />
              </div>
            ))}
          </div>

          <h3 style={{ margin: `0 0 ${space.s2}px`, fontSize: fontSize.body, fontWeight: fontWeight.heavy, letterSpacing: '0.06em', textTransform: 'uppercase', color: color.ink2 }}>
            {t('schedule', locale)}
          </h3>
          <div style={{ background: color.surface, borderRadius: radius.md, border: `1px solid ${color.line}`, overflow: 'hidden', marginBottom: space.s4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: color.tint }}>
                  <th style={headerCell}>#</th>
                  <th style={headerCell}>{t('due', locale)}</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>{t('amount', locale)}</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>{t('paid', locale)}</th>
                  <th style={headerCell}>{t('state', locale)}</th>
                </tr>
              </thead>
              <tbody>
                {detail.schedule.map((r) => (
                  <tr key={r.seq}>
                    <td style={cell}>{r.seq}</td>
                    <td style={cell}>{formatDate(r.dueDate)}</td>
                    <td style={{ ...cell, textAlign: 'right' }}><MoneyDisplay amountTzs={r.amountTzs} /></td>
                    <td style={{ ...cell, textAlign: 'right' }}><MoneyDisplay amountTzs={r.paidTzs} variant={r.paidTzs > 0 ? 'positive' : 'muted'} /></td>
                    <td style={cell}><span style={rowPill[r.status]}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: `0 0 ${space.s2}px`, fontSize: fontSize.body, fontWeight: fontWeight.heavy, letterSpacing: '0.06em', textTransform: 'uppercase', color: color.ink2 }}>
            {t('remindersTitle', locale)}
          </h3>
          {detail.reminders.length === 0 ? (
            <div style={{ color: color.ink3, padding: space.s3 }}>{t('noReminders', locale)}</div>
          ) : (
            <div style={{ background: color.surface, borderRadius: radius.md, border: `1px solid ${color.line}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: color.tint }}>
                    <th style={headerCell}>{t('when', locale)}</th>
                    <th style={headerCell}>{t('due', locale)}</th>
                    <th style={headerCell}>{t('sentTo', locale)}</th>
                    <th style={{ ...headerCell, textAlign: 'right' }}>{t('amount', locale)}</th>
                    <th style={headerCell}>{t('state', locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.reminders.map((r) => (
                    <tr key={r.id}>
                      <td style={cell}>
                        {formatDateTime(r.sentAt)}
                        <span style={{ marginLeft: space.s2, fontSize: fontSize.xs, color: color.steel, fontWeight: fontWeight.heavy }}>
                          {offsetLabel(r.offsetDays, locale)}
                        </span>
                      </td>
                      <td style={cell}>{formatDate(r.dueDate)}</td>
                      <td style={{ ...cell, color: color.ink2 }}>{r.msisdn}</td>
                      <td style={{ ...cell, textAlign: 'right' }}><MoneyDisplay amountTzs={r.amountTzs} /></td>
                      <td style={cell}>
                        <span style={reminderPill[r.status]} title={r.error ?? undefined}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
