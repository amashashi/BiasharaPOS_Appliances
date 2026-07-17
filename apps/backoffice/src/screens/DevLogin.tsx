import { useEffect, useState } from 'react';
import { Button, color, font, fontSize, radius, space } from '@biashara/ui';
import { devContext, devLogin, type Session } from '../api.js';

const field: React.CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: `${space.s2}px ${space.s3}px`,
  fontFamily: font.sans,
  fontSize: fontSize.body,
  border: `1px solid ${color.line2}`,
  borderRadius: radius.sm,
  boxSizing: 'border-box',
};

/** Stub-era back-office sign-in (D-028) — always OWNER. Deleted at T5.1. */
export function DevLogin({ onSignIn }: { onSignIn: (s: Session) => void }) {
  const [merchants, setMerchants] = useState<Array<{ id: string; name: string }>>([]);
  const [merchantId, setMerchantId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    devContext()
      .then((c) => {
        setMerchants(c.merchants);
        if (c.merchants[0]) setMerchantId(c.merchants[0].id);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const submit = async (): Promise<void> => {
    if (!merchantId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await devLogin(merchantId, name);
      onSignIn({ token: res.token, merchant: res.merchant, displayName: res.displayName, role: res.role });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main style={{ fontFamily: font.sans, minHeight: '100vh', display: 'grid', placeItems: 'center', background: color.bg, color: color.ink }}>
      <div style={{ width: 360, maxWidth: '92vw', background: color.surface, borderRadius: radius.md, padding: space.s5, border: `1px solid ${color.line}` }}>
        <img src="/logo-lockup.svg" alt="BiasharaPOS Appliances & Electronics" style={{ width: 260, display: 'block', margin: `0 auto ${space.s4}px` }} />
        <div style={{ textAlign: 'center', color: color.ink3, fontSize: fontSize.body, marginBottom: space.s3 }}>
          Back office (dev sign-in)
        </div>
        {error && <div style={{ color: color.red, fontSize: fontSize.body, marginBottom: space.s2 }}>{error}</div>}
        <label style={{ display: 'block', margin: `${space.s2}px 0 ${space.s1}px`, color: color.ink2, fontSize: fontSize.sm }}>Merchant</label>
        <select style={field} value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <label style={{ display: 'block', margin: `${space.s3}px 0 ${space.s1}px`, color: color.ink2, fontSize: fontSize.sm }}>Your name</label>
        <input style={field} value={name} placeholder="Asha" onChange={(e) => setName(e.target.value)} />
        <div style={{ marginTop: space.s4 }}>
          <Button pos loading={busy} style={{ width: '100%' }} onClick={() => void submit()}>Sign in</Button>
        </div>
      </div>
    </main>
  );
}
