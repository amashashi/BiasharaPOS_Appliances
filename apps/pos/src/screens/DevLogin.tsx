import { useEffect, useState } from 'react';
import { Button, color, font, fontSize, fontWeight, radius, space, type Locale } from '@biashara/ui';
import { devContext, devLogin, type Session } from '../api.js';
import { ts } from '../strings.js';

const field: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: `${space.s2}px ${space.s3}px`,
  fontFamily: font.sans,
  fontSize: fontSize.bodyLg,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.sm,
  background: color.surface,
  boxSizing: 'border-box',
};
const label: React.CSSProperties = {
  display: 'block',
  margin: `${space.s3}px 0 ${space.s1}px`,
  color: color.ink2,
  fontSize: fontSize.body,
  fontWeight: fontWeight.semibold,
};

/** Stub-era sign-in (D-028): pick merchant/location/role. Deleted at T5.1. */
export function DevLogin({ locale, onSignIn }: { locale: Locale; onSignIn: (s: Session) => void }) {
  const [ctx, setCtx] = useState<Awaited<ReturnType<typeof devContext>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CASHIER');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    devContext()
      .then((c) => {
        setCtx(c);
        const m = c.merchants[0];
        if (m) {
          setMerchantId(m.id);
          if (m.locations[0]) setLocationId(m.locations[0].id);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const merchant = ctx?.merchants.find((m) => m.id === merchantId);

  const submit = async (): Promise<void> => {
    if (!merchant || !locationId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await devLogin(merchantId, name, role);
      const location = merchant.locations.find((l) => l.id === locationId);
      onSignIn({
        token: res.token,
        merchant: res.merchant,
        locationId,
        locationName: location?.name ?? '',
        displayName: res.displayName,
        role: res.role,
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        fontFamily: font.sans, minHeight: '100vh', display: 'grid', placeItems: 'center',
        background: color.bg, color: color.ink,
      }}
    >
      <div style={{ width: 360, maxWidth: '92vw', background: color.surface, borderRadius: radius.md, padding: space.s5, border: `1px solid ${color.line}` }}>
        <img src="/logo-lockup.svg" alt="BiasharaPOS Appliances & Electronics" style={{ width: 260, display: 'block', margin: `0 auto ${space.s4}px` }} />
        <div style={{ textAlign: 'center', color: color.ink3, fontSize: fontSize.body, marginBottom: space.s2 }}>
          {ts('devSignIn', locale)}
        </div>
        {error && (
          <div style={{ color: color.red, fontSize: fontSize.body, margin: `${space.s2}px 0` }}>{error}</div>
        )}
        {ctx && (
          <>
            <label style={label}>{ts('merchant', locale)}</label>
            <select
              style={field}
              value={merchantId}
              onChange={(e) => {
                setMerchantId(e.target.value);
                const m = ctx.merchants.find((x) => x.id === e.target.value);
                setLocationId(m?.locations[0]?.id ?? '');
              }}
            >
              {ctx.merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <label style={label}>{ts('location', locale)}</label>
            <select style={field} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              {(merchant?.locations ?? []).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <label style={label}>{ts('yourName', locale)}</label>
            <input style={field} value={name} placeholder="Asha" onChange={(e) => setName(e.target.value)} />
            <label style={label}>{ts('role', locale)}</label>
            <select style={field} value={role} onChange={(e) => setRole(e.target.value)}>
              {ctx.roles.filter((r) => r !== 'DELIVERY').map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div style={{ marginTop: space.s4 }}>
              <Button pos loading={busy} style={{ width: '100%' }} onClick={() => void submit()}>
                {ts('signIn', locale)}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
