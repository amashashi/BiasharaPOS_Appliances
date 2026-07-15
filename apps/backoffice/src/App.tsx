/**
 * Back-office shell — placeholder until M6 dashboards.
 * Brand values inline for now; T0.6 replaces these with @biashara/ui tokens.
 */
export function App(): JSX.Element {
  return (
    <main
      style={{
        fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#F6F8F7',
        color: '#1F2937',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>
          Biashara<span style={{ color: '#239B46' }}>POS</span>
        </h1>
        <p style={{ color: '#1D6A96', letterSpacing: '0.2em', fontSize: 13, fontWeight: 600 }}>
          APPLIANCES &amp; ELECTRONICS — BACK OFFICE
        </p>
        <p style={{ color: '#6B7280' }}>Shell scaffold (T0.1). Dashboards arrive in M6.</p>
      </div>
    </main>
  );
}
