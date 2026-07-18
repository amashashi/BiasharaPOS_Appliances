/** POS checkout strings — Swahili first (DESIGN_SYSTEM.md §7). */
import type { Locale } from '@biashara/ui';

const dict = {
  signIn: { sw: 'Ingia', en: 'Sign in' },
  phone: { sw: 'Namba ya simu', en: 'Phone number' },
  pin: { sw: 'PIN (tarakimu 4)', en: 'PIN (4 digits)' },
  location: { sw: 'Tawi', en: 'Location' },
  chooseLocation: { sw: 'Chagua tawi la kuuzia', en: 'Choose the till location' },
  noLocations: { sw: 'Duka halina tawi — wasiliana na mmiliki', en: 'No locations set up — contact the owner' },
  continueBtn: { sw: 'Endelea', en: 'Continue' },
  signOut: { sw: 'Toka', en: 'Sign out' },
  searchPlaceholder: { sw: 'Tafuta bidhaa au skani…', en: 'Search or scan a product…' },
  noResults: { sw: 'Hakuna bidhaa', en: 'No products found' },
  cart: { sw: 'Kikapu', en: 'Cart' },
  cartEmpty: { sw: 'Kikapu ni tupu — chagua bidhaa', en: 'Cart is empty — pick a product' },
  customer: { sw: 'Mteja', en: 'Customer' },
  customerName: { sw: 'Jina la mteja', en: 'Customer name' },
  customerPhone: { sw: 'Simu ya mteja', en: 'Customer phone' },
  total: { sw: 'JUMLA', en: 'TOTAL' },
  pay: { sw: 'Lipa', en: 'Pay' },
  payFull: { sw: 'Lipa yote', en: 'Pay in full' },
  deposit: { sw: 'Amana', en: 'Deposit' },
  depositAmount: { sw: 'Kiasi cha amana (TZS)', en: 'Deposit amount (TZS)' },
  cash: { sw: 'Taslimu', en: 'Cash' },
  mobileMoney: { sw: 'Pesa za simu', en: 'Mobile money' },
  provider: { sw: 'Mtandao', en: 'Provider' },
  phoneForPush: { sw: 'Namba ya kulipia (+255…)', en: 'Paying number (+255…)' },
  sendPush: { sw: 'Tuma ombi la malipo', en: 'Send payment request' },
  awaitingApproval: { sw: 'Inasubiri mteja akubali kwenye simu…', en: 'Waiting for the customer to approve on their phone…' },
  pushFailed: { sw: 'Malipo yameshindikana', en: 'Payment failed' },
  simulateApprove: { sw: '[DEV] Mteja amekubali', en: '[DEV] Customer approved' },
  simulateDecline: { sw: '[DEV] Mteja amekataa', en: '[DEV] Customer declined' },
  receipt: { sw: 'Risiti', en: 'Receipt' },
  preparingReceipt: { sw: 'Inaandaa risiti ya TRA…', en: 'Preparing the TRA receipt…' },
  print: { sw: 'Chapisha', en: 'Print' },
  newSale: { sw: 'Mauzo mapya', en: 'New sale' },
  balanceAfter: { sw: 'Baki', en: 'Balance' },
  cancel: { sw: 'Ghairi', en: 'Cancel' },
  error: { sw: 'Hitilafu', en: 'Error' },
} as const;

export type PosStringKey = keyof typeof dict;

export const ts = (key: PosStringKey, locale: Locale): string => dict[key][locale];
