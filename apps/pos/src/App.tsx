/**
 * POS shell — placeholder until T2.6 builds the checkout flow.
 * Brand lockup per DESIGN_SYSTEM.md §6 (canonical assets, D-016); tokens only.
 */
import { color, font, fontSize, fontWeight, space } from '@biashara/ui';

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
        <img
          src="/logo-lockup.svg"
          alt="BiasharaPOS Appliances & Electronics"
          style={{ width: 320, maxWidth: '80vw', marginBottom: space.s4 }}
        />
        <p style={{ color: color.ink3, fontSize: fontSize.body, fontWeight: fontWeight.regular }}>
          Shell scaffold. Checkout arrives in M2.
        </p>
      </div>
    </main>
  );
}
