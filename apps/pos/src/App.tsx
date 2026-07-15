/**
 * POS shell — placeholder until T2.6 builds the checkout flow.
 * Styled from @biashara/ui tokens (T0.6); no raw brand values here.
 */
import { brand, color, font, fontSize, fontWeight, space } from '@biashara/ui';

export function App(): JSX.Element {
  return (
    <main
      style={{
        fontFamily: font.sans,
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: color.bg,
        color: color.ink,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontWeight: fontWeight.heavy }}>
          Biashara<span style={{ color: brand.secondary }}>POS</span>
        </h1>
        <p
          style={{
            color: brand.subBrand,
            letterSpacing: '0.2em',
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            margin: `${space.s2}px 0`,
          }}
        >
          APPLIANCES &amp; ELECTRONICS — POS
        </p>
        <p style={{ color: color.ink3 }}>Shell scaffold. Checkout arrives in M2.</p>
      </div>
    </main>
  );
}
