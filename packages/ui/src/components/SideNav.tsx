import type { ReactNode } from 'react';
import { color, font, fontSize, fontWeight, layout, radius, space } from '../tokens.js';
import type { Locale } from '../i18n.js';

/**
 * Back-office navigation sidebar (handoff prototype: navStyle "sidebar" is the
 * default; structure = brand block → "Menu" label → icon+label destinations →
 * business footer). Visuals composed from tokens per DESIGN_SYSTEM.md: light
 * surface, hairline border, §3 eyebrow label, active item = blue-50/blue-d
 * (blue is the brand/link color, §2), outline icons ~1.8 stroke (§4).
 */

export interface NavItem {
  id: string;
  label: { sw: string; en: string };
  icon: NavIconName;
  /** Badge, e.g. count of arrears agreements. */
  badge?: number;
  /** Not yet built — rendered dimmed with the milestone that delivers it. */
  comingSoon?: string;
  /**
   * Link-out destination (e.g. "Make a Sale" → the POS app, per the handoff
   * NAV list). Rendered as an anchor opening a new tab; never "active".
   */
  href?: string;
}

export interface SideNavProps {
  items: NavItem[];
  value: string;
  onChange: (id: string) => void;
  locale: Locale;
  businessName: string;
  /** Signed-in user line under the business name. */
  userLine?: string;
  footer?: ReactNode;
}

export function SideNav({ items, value, onChange, locale, businessName, userLine, footer }: SideNavProps) {
  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: color.surface,
        borderRight: `1px solid ${color.line}`,
        fontFamily: font.sans,
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* brand block — canonical repo assets (§6, D-016); wordmark Biashara ink + POS green */}
      <div style={{ display: 'flex', alignItems: 'center', gap: space.s2, padding: `${space.s3}px ${space.s3}px ${space.s2}px` }}>
        <img src="/logo-icon.svg" alt="" style={{ width: 28, height: 28 }} />
        <div style={{ fontSize: fontSize.bodyLg, fontWeight: fontWeight.heavy, letterSpacing: '-0.02em', color: color.ink }}>
          Biashara<span style={{ color: color.green }}>POS</span>
        </div>
      </div>

      {/* §3 eyebrow: xs, 800, letterspaced caps */}
      <div
        style={{
          padding: `${space.s2}px ${space.s3}px ${space.s1}px`,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.heavy,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: color.ink3,
        }}
      >
        {locale === 'sw' ? 'Menyu' : 'Menu'}
      </div>

      <nav role="tablist" aria-orientation="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: `0 ${space.s2}px`, flex: 1 }}>
        {items.map((item) => {
          const active = item.id === value;
          const dimmed = Boolean(item.comingSoon);
          if (item.href) {
            // same-tab navigation (owner decision 2026-07-18): the till takes
            // over the screen; the browser back button returns to the office
            return (
              <a
                key={item.id}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: space.s2,
                  minHeight: layout.posTouchTarget - 4,
                  padding: `${space.s1}px ${space.s2}px`,
                  borderRadius: radius.sm,
                  color: color.ink2,
                  textDecoration: 'none',
                  fontFamily: font.sans,
                  fontSize: fontSize.body,
                  fontWeight: fontWeight.medium,
                }}
              >
                <NavIcon name={item.icon} />
                <span style={{ flex: 1 }}>{item.label[locale]}</span>
                <ExternalMark />
              </a>
            );
          }
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: space.s2,
                minHeight: layout.posTouchTarget - 4, // 44px targets in back office
                padding: `${space.s1}px ${space.s2}px`,
                border: 'none',
                borderRadius: radius.sm,
                background: active ? color.blue50 : 'transparent',
                color: active ? color.blueD : dimmed ? color.ink3 : color.ink2,
                fontFamily: font.sans,
                fontSize: fontSize.body,
                fontWeight: active ? fontWeight.bold : fontWeight.medium,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <NavIcon name={item.icon} />
              <span style={{ flex: 1 }}>{item.label[locale]}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  style={{
                    minWidth: 20,
                    padding: `1px ${space.s1}px`,
                    borderRadius: radius.pill,
                    background: color.red50,
                    color: color.red,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.heavy,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.badge}
                </span>
              )}
              {dimmed && (
                <span style={{ fontSize: fontSize.xs, color: color.ink3, fontWeight: fontWeight.medium }}>{item.comingSoon}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* business footer (prototype SideNav footer) */}
      <div style={{ borderTop: `1px solid ${color.line}`, padding: space.s3 }}>
        <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: color.ink }}>{businessName}</div>
        {userLine && <div style={{ fontSize: fontSize.xs, color: color.ink3, marginTop: 2 }}>{userLine}</div>}
        {footer && <div style={{ marginTop: space.s2 }}>{footer}</div>}
      </div>
    </aside>
  );
}

// ── outline icons, ~1.8px stroke (§4), currentColor ──

export type NavIconName =
  | 'dashboard'
  | 'sale'
  | 'catalog'
  | 'stock'
  | 'orders'
  | 'credit'
  | 'delivery'
  | 'reconciliation'
  | 'design';

/** Small outward arrow marking link-out items. */
function ExternalMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ opacity: 0.55 }}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  const paths: Record<NavIconName, ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
    sale: (
      <>
        <circle cx="9" cy="20" r="1.6" />
        <circle cx="18" cy="20" r="1.6" />
        <path d="M2.5 3.5h3l2.6 12h10.4l2-8.5H6.2" />
      </>
    ),
    catalog: (
      <>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V5a2 2 0 0 1 2-2h8l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </>
    ),
    stock: (
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    ),
    orders: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z" />
        <path d="M9 7h6M9 11h6" />
      </>
    ),
    credit: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 10h18M7 3v4M17 3v4M7.5 15h3" />
      </>
    ),
    delivery: (
      <>
        <path d="M2 6h11v10H2zM13 9h5l3 3v4h-8" />
        <circle cx="6" cy="18" r="1.8" />
        <circle cx="17" cy="18" r="1.8" />
      </>
    ),
    reconciliation: (
      <>
        <path d="M12 3v18M7 21h10M6 6h12M6 6 3 12h6L6 6ZM18 6l-3 6h6l-3-6Z" />
      </>
    ),
    design: (
      <>
        <path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.4c.6.7.2 2.6-2.5 2.6Z" />
        <circle cx="7.5" cy="10.5" r="1" />
        <circle cx="12" cy="7.5" r="1" />
        <circle cx="16.5" cy="10.5" r="1" />
      </>
    ),
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}
