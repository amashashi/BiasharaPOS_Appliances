import { useEffect, useState } from 'react';
import {
  Button, SideNav, color, font, fontSize, fontWeight, radius, space,
  type Locale, type NavItem,
} from '@biashara/ui';
import type { Session } from './api.js';
import { Arrears } from './screens/Arrears.js';
import { Showcase } from './Showcase.js';

/**
 * Back-office app shell (handoff: navStyle "sidebar"). Modules register here
 * and fill in one by one as their tasks land; unbuilt ones show the milestone
 * that delivers them. Hash-routed (#/module) — refresh keeps your place,
 * no router dependency.
 */

const MODULES: NavItem[] = [
  { id: 'dashboard', label: { sw: 'Dashibodi', en: 'Dashboard' }, icon: 'dashboard', comingSoon: 'M6' },
  { id: 'catalog', label: { sw: 'Katalogi', en: 'Catalog' }, icon: 'catalog', comingSoon: 'M6' },
  { id: 'stock', label: { sw: 'Stoo', en: 'Stock' }, icon: 'stock', comingSoon: 'M6' },
  { id: 'orders', label: { sw: 'Oda', en: 'Orders' }, icon: 'orders', comingSoon: 'M6' },
  { id: 'credit', label: { sw: 'Mikopo', en: 'Credit' }, icon: 'credit' },
  { id: 'deliveries', label: { sw: 'Uwasilishaji', en: 'Deliveries' }, icon: 'delivery', comingSoon: 'M4' },
  { id: 'design', label: { sw: 'Muundo', en: 'Design' }, icon: 'design' },
];

const DEFAULT_MODULE = 'credit';

const readHash = (): string => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return MODULES.some((m) => m.id === id) ? id : DEFAULT_MODULE;
};

export function Shell({
  session, locale, onLocale, onSignOut,
}: {
  session: Session;
  locale: Locale;
  onLocale: (l: Locale) => void;
  onSignOut: () => void;
}) {
  const [moduleId, setModuleId] = useState(readHash);

  useEffect(() => {
    const onHash = (): void => setModuleId(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (id: string): void => {
    window.location.hash = `/${id}`;
    setModuleId(id);
  };

  const current = MODULES.find((m) => m.id === moduleId) ?? MODULES[0];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: color.bg, fontFamily: font.sans, color: color.ink }}>
      <SideNav
        items={MODULES}
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
        {moduleId === 'credit' && <Arrears session={session} locale={locale} />}
        {moduleId === 'design' && <Showcase />}
        {current.comingSoon && <ComingSoon item={current} locale={locale} />}
      </main>
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
