import { useEffect, useState } from 'react';
import {
  Button, SideNav, color, font, fontSize, fontWeight, radius, space,
  type Locale, type NavItem,
} from '@biashara/ui';
import { fetchFiscalAging, type FiscalAging, type Session } from './api.js';
import { Dashboard } from './screens/Dashboard.js';
import { Arrears } from './screens/Arrears.js';
import { Dispatch } from './screens/Dispatch.js';
import { Reconciliation } from './screens/Reconciliation.js';
import { Exceptions } from './screens/Exceptions.js';
import { Showcase } from './Showcase.js';

/**
 * Back-office app shell (handoff: navStyle "sidebar"). Modules register here
 * and fill in one by one as their tasks land; unbuilt ones show the milestone
 * that delivers them. Hash-routed (#/module) — refresh keeps your place,
 * no router dependency.
 */

/** The POS app is a separate offline-first PWA; "Make a Sale" links out to it. */
const POS_URL = (import.meta.env.VITE_POS_URL as string | undefined) ?? 'http://localhost:5173';

const ALL_MODULES: NavItem[] = [
  { id: 'dashboard', label: { sw: 'Dashibodi', en: 'Dashboard' }, icon: 'dashboard' },
  { id: 'sale', label: { sw: 'Fanya Mauzo', en: 'Make a Sale' }, icon: 'sale', href: POS_URL },
  { id: 'catalog', label: { sw: 'Katalogi', en: 'Catalog' }, icon: 'catalog', comingSoon: 'M6' },
  { id: 'stock', label: { sw: 'Stoo', en: 'Stock' }, icon: 'stock', comingSoon: 'M6' },
  { id: 'orders', label: { sw: 'Oda', en: 'Orders' }, icon: 'orders', comingSoon: 'M6' },
  { id: 'credit', label: { sw: 'Mikopo', en: 'Credit' }, icon: 'credit' },
  { id: 'deliveries', label: { sw: 'Uwasilishaji', en: 'Deliveries' }, icon: 'delivery' },
  { id: 'reconciliation', label: { sw: 'Ulinganishaji', en: 'Reconciliation' }, icon: 'reconciliation' },
  { id: 'exceptions', label: { sw: 'Migogoro', en: 'Exceptions' }, icon: 'exceptions' },
  { id: 'design', label: { sw: 'Muundo', en: 'Design' }, icon: 'design' },
];

/** Delivery staff get a focused nav — just their dispatch list. */
const modulesFor = (role: string): NavItem[] =>
  role === 'DELIVERY' ? ALL_MODULES.filter((m) => m.id === 'deliveries') : ALL_MODULES;

const defaultModuleFor = (role: string): string => (role === 'DELIVERY' ? 'deliveries' : 'dashboard');

const readHash = (modules: NavItem[], fallback: string): string => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return modules.some((m) => m.id === id) ? id : fallback;
};

export function Shell({
  session, locale, onLocale, onSignOut,
}: {
  session: Session;
  locale: Locale;
  onLocale: (l: Locale) => void;
  onSignOut: () => void;
}) {
  const modules = modulesFor(session.role);
  const fallback = defaultModuleFor(session.role);
  const [moduleId, setModuleId] = useState(() => readHash(modules, fallback));

  useEffect(() => {
    const onHash = (): void => setModuleId(readHash(modules, fallback));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [modules, fallback]);

  const navigate = (id: string): void => {
    window.location.hash = `/${id}`;
    setModuleId(id);
  };

  const current = modules.find((m) => m.id === moduleId) ?? modules[0];

  // Single-destination users (delivery staff) get a slim top bar + full-width
  // content instead of a sidebar — proper mobile ergonomics on a phone.
  if (modules.length === 1) {
    return (
      <div style={{ minHeight: '100vh', background: color.bg, fontFamily: font.sans, color: color.ink }}>
        <header
          style={{
            display: 'flex', alignItems: 'center', gap: space.s2,
            padding: `${space.s2}px ${space.s3}px`, background: color.surface,
            borderBottom: `1px solid ${color.line}`, position: 'sticky', top: 0, zIndex: 5,
          }}
        >
          <img src="/logo-icon.svg" alt="" style={{ width: 28, height: 28 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: fontWeight.bold, fontSize: fontSize.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.merchant.name}
            </div>
            <div style={{ fontSize: fontSize.xs, color: color.ink3 }}>{session.displayName} · {session.role}</div>
          </div>
          <Button variant="ghost" onClick={() => onLocale(locale === 'sw' ? 'en' : 'sw')} style={{ padding: `${space.s1}px ${space.s2}px` }}>
            {locale === 'sw' ? 'EN' : 'SW'}
          </Button>
          <Button variant="ghost" onClick={onSignOut} style={{ padding: `${space.s1}px ${space.s2}px` }}>
            {locale === 'sw' ? 'Toka' : 'Sign out'}
          </Button>
        </header>
        <main>{moduleId === 'deliveries' && <Dispatch session={session} locale={locale} />}</main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: color.bg, fontFamily: font.sans, color: color.ink }}>
      <SideNav
        items={modules}
        value={moduleId}
        onChange={navigate}
        locale={locale}
        businessName={session.merchant.name}
        userLine={`${session.displayName} · ${session.role}`}
        footer={
          <div style={{ display: 'flex', gap: space.s1 }}>
            <Button variant="ghost" onClick={() => onLocale(locale === 'sw' ? 'en' : 'sw')} style={{ padding: `${space.s1}px ${space.s2}px` }}>
              {locale === 'sw' ? 'English' : 'Kiswahili'}
            </Button>
            <Button variant="ghost" onClick={onSignOut} style={{ padding: `${space.s1}px ${space.s2}px` }}>
              {locale === 'sw' ? 'Toka' : 'Sign out'}
            </Button>
          </div>
        }
      />
      <main style={{ flex: 1, minWidth: 0 }}>
        {session.role === 'OWNER' && <FiscalAgingBanner session={session} locale={locale} />}
        {moduleId === 'dashboard' && <Dashboard session={session} locale={locale} />}
        {moduleId === 'credit' && <Arrears session={session} locale={locale} />}
        {moduleId === 'deliveries' && <Dispatch session={session} locale={locale} />}
        {moduleId === 'reconciliation' && <Reconciliation session={session} locale={locale} />}
        {moduleId === 'exceptions' && <Exceptions session={session} locale={locale} />}
        {moduleId === 'design' && <Showcase />}
        {current?.comingSoon && <ComingSoon item={current} locale={locale} />}
      </main>
    </div>
  );
}

/**
 * Fiscal aging alert (T5.7): a red strip when any payment is overdue for
 * fiscalization (past the TRA window) — a compliance risk the OWNER must see on
 * every screen. Silent when the fiscal queue is caught up. Re-checks each minute.
 */
function FiscalAgingBanner({ session, locale }: { session: Session; locale: Locale }) {
  const [aging, setAging] = useState<FiscalAging | null>(null);
  useEffect(() => {
    const load = (): void => void fetchFiscalAging(session).then(setAging).catch(() => undefined);
    load();
    const h = setInterval(load, 60_000);
    return () => clearInterval(h);
  }, [session]);

  if (!aging || aging.count === 0) return null;
  const msg = locale === 'sw'
    ? `${aging.count} malipo hayajapata risiti ya TRA (zaidi ya saa ${aging.windowHours}; kongwe: saa ${aging.oldestAgeHours})`
    : `${aging.count} payment(s) overdue for TRA fiscalization (> ${aging.windowHours}h; oldest: ${aging.oldestAgeHours}h)`;
  return (
    <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: space.s2, background: color.red, color: color.white, padding: `${space.s2}px ${space.s4}px`, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
      <span aria-hidden>⚠️</span>
      {msg}
    </div>
  );
}

function ComingSoon({ item, locale }: { item: NavItem; locale: Locale }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div
        style={{
          background: color.surface,
          border: `1px solid ${color.line}`,
          borderRadius: radius.md,
          padding: space.s6,
          textAlign: 'center',
          maxWidth: 420,
        }}
      >
        <div style={{ fontSize: fontSize.h3, fontWeight: fontWeight.heavy, letterSpacing: '-0.01em', marginBottom: space.s2 }}>
          {item.label[locale]}
        </div>
        <div style={{ color: color.ink2, fontSize: fontSize.body }}>
          {locale === 'sw'
            ? `Sehemu hii inajengwa — inawasili katika hatua ya ${item.comingSoon}.`
            : `This module is under construction — it arrives in milestone ${item.comingSoon}.`}
        </div>
      </div>
    </div>
  );
}
