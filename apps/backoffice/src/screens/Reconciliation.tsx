import { useEffect, useState } from 'react';
import {
  Button, MoneyDisplay, color, font, fontSize, fontWeight, formatDateTime,
  radius, space, type Locale,
} from '@biashara/ui';
import { fetchReconciliation, resolveReconciliation, type ReconciliationRow, type Session } from '../api.js';

const S = {
  title: { sw: 'Ulinganishaji wa malipo', en: 'Payment reconciliation' },
  intro: {
    sw: 'Malipo ya simu yaliyothibitishwa lakini hayakuwekwa kwenye oda — amua kila moja.',
    en: 'Mobile-money payments confirmed but not applied to an order — resolve each one.',
  },
  none: { sw: 'Hakuna malipo yanayosubiri ulinganishaji 🎉', en: 'Nothing awaiting reconciliation 🎉' },
  totalHeld: { sw: 'Jumla iliyoshikiliwa', en: 'Total held' },
  items: { sw: 'vipengele', en: 'items' },
  order: { sw: 'Oda', en: 'Order' },
  provider: { sw: 'Mtoa huduma', en: 'Provider' },
  amount: { sw: 'Kiasi', en: 'Amount' },
  ref: { sw: 'Kumbukumbu', en: 'Reference' },
  received: { sw: 'Ilipokelewa', en: 'Received' },
  why: { sw: 'Sababu', en: 'Reason' },
  resolve: { sw: 'Suluhisha', en: 'Resolve' },
  resolvePrompt: { sw: 'Andika ulichofanya (mf. umerejesha pesa)', en: 'Note what you did (e.g. refunded)' },
  save: { sw: 'Hifadhi', en: 'Save' },
  cancel: { sw: 'Ghairi', en: 'Cancel' },
  unapplied: { sw: 'Halikutosha salio', en: "Didn't fit balance" },
  unknown: { sw: 'Oda haijulikani', en: 'Unknown order' },
} as const;
const t = (k: keyof typeof S, l: Locale): string => S[k][l];

const cell: React.CSSProperties = {
  padding: `${space.s2}px ${space.s3}px`,
  textAlign: 'left',
  fontSize: fontSize.body,
  borderBottom: `1px solid ${color.line}`,
  verticalAlign: 'middle',
};
const headerCell: React.CSSProperties = {
  ...cell,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: color.ink2,
};
const reasonPill: React.CSSProperties = {
  display: 'inline-block',
  padding: `${space.s1}px ${space.s2}px`,
  borderRadius: radius.xs,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.heavy,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: color.gold50,
  color: color.amber,
};

/** Reconciliation queue (T5.3a): OWNER resolves confirmed-but-unapplied mobile money. */
export function Reconciliation({ session, locale }: { session: Session; locale: Locale }) {
  const [data, setData] = useState<{ items: ReconciliationRow[]; totalTzs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = (): void => {
    fetchReconciliation(session)
      .then((r) => { setData(r); setError(null); })
      .catch((e: Error) => setError(e.message));
  };
  useEffect(load, [session]);

  const submit = async (id: string): Promise<void> => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await resolveReconciliation(session, id, note.trim());
      setResolvingId(null);
      setNote('');
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: space.s4, maxWidth: 900, margin: '0 auto', fontFamily: font.sans }}>
      <h2 style={{ margin: `0 0 ${space.s1}px`, fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em' }}>
        {t('title', locale)}
      </h2>
      <div style={{ color: color.ink2, fontSize: fontSize.body, marginBottom: space.s4 }}>{t('intro', locale)}</div>

      {error && <div style={{ color: color.red, marginBottom: space.s3 }}>{error}</div>}

      {data && data.items.length === 0 && (
        <div style={{ padding: space.s6, textAlign: 'center', color: color.ink3, fontSize: fontSize.lead }}>
          {t('none', locale)}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div style={{ textAlign: 'right', marginBottom: space.s2 }}>
            <span style={{ fontSize: fontSize.xs, fontWeight: fontWeight.heavy, letterSpacing: '0.06em', textTransform: 'uppercase', color: color.ink3 }}>
              {t('totalHeld', locale)}
            </span>{' '}
            <MoneyDisplay amountTzs={data.totalTzs} />{' '}
            <span style={{ color: color.ink3, fontSize: fontSize.sm }}>· {data.items.length} {t('items', locale)}</span>
          </div>
          <div style={{ overflowX: 'auto', border: `1px solid ${color.line}`, borderRadius: radius.md }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerCell}>{t('order', locale)}</th>
                  <th style={headerCell}>{t('provider', locale)}</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>{t('amount', locale)}</th>
                  <th style={headerCell}>{t('why', locale)}</th>
                  <th style={headerCell}>{t('received', locale)}</th>
                  <th style={headerCell} />
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td style={cell}>
                      <div style={{ fontWeight: fontWeight.semibold }}>{row.order?.numberFormatted ?? t('unknown', locale)}</div>
                      {row.providerRef && <div style={{ color: color.ink3, fontSize: fontSize.xs, fontFamily: font.mono }}>{row.providerRef}</div>}
                    </td>
                    <td style={cell}>{row.provider ?? '—'}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      <MoneyDisplay amountTzs={row.amountTzs ?? 0} />
                    </td>
                    <td style={cell}>
                      <span style={reasonPill}>{t('unapplied', locale)}</span>
                    </td>
                    <td style={{ ...cell, color: color.ink3, fontSize: fontSize.sm }}>{formatDateTime(row.receivedAt)}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      {resolvingId === row.id ? (
                        <div style={{ display: 'flex', gap: space.s1, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <input
                            autoFocus
                            placeholder={t('resolvePrompt', locale)}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            style={{ minWidth: 200, minHeight: 36, padding: `${space.s1}px ${space.s2}px`, fontFamily: font.sans, fontSize: fontSize.sm, border: `1px solid ${color.line2}`, borderRadius: radius.sm }}
                          />
                          <Button variant="secondary" onClick={() => { setResolvingId(null); setNote(''); }}>{t('cancel', locale)}</Button>
                          <Button loading={busy} disabled={!note.trim()} onClick={() => void submit(row.id)}>{t('save', locale)}</Button>
                        </div>
                      ) : (
                        <Button variant="secondary" onClick={() => { setResolvingId(row.id); setNote(''); }}>{t('resolve', locale)}</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
