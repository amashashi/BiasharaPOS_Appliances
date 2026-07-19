/**
 * SMS message bodies for the NotificationService port (T5.4). The port carries a
 * templateKey + params (not text), so the real adapter renders here. Reminders
 * go to customers, whose language in TZ is Swahili by default (NOTIFICATION_LOCALE
 * overrides); English is kept for completeness. Per-merchant customization is a
 * later concern — these are the sensible defaults.
 */
export type SmsLocale = 'sw' | 'en';

type Render = (p: Record<string, string>) => string;

const TEMPLATES: Record<string, Record<SmsLocale, Render>> = {
  'reminder.upcoming': {
    sw: (p) => `Habari ${p.customerName}. Kumbukumbu: malipo ya oda ${p.orderNumber} kiasi TZS ${p.amountTzs} yanatarajiwa tarehe ${p.dueDate}. Asante, ${p.merchantName}.`,
    en: (p) => `Hello ${p.customerName}. Reminder: payment for order ${p.orderNumber} of TZS ${p.amountTzs} is due on ${p.dueDate}. Thank you, ${p.merchantName}.`,
  },
  'reminder.due': {
    sw: (p) => `Habari ${p.customerName}. Malipo ya oda ${p.orderNumber} kiasi TZS ${p.amountTzs} yanatakiwa LEO (${p.dueDate}). Tafadhali lipa. Asante, ${p.merchantName}.`,
    en: (p) => `Hello ${p.customerName}. Payment for order ${p.orderNumber} of TZS ${p.amountTzs} is due TODAY (${p.dueDate}). Please pay. Thank you, ${p.merchantName}.`,
  },
  'reminder.overdue': {
    sw: (p) => `Habari ${p.customerName}. Malipo ya oda ${p.orderNumber} kiasi TZS ${p.amountTzs} yamechelewa siku ${p.daysOverdue}. Tafadhali lipa haraka. Asante, ${p.merchantName}.`,
    en: (p) => `Hello ${p.customerName}. Payment for order ${p.orderNumber} of TZS ${p.amountTzs} is ${p.daysOverdue} day(s) overdue. Please pay soon. Thank you, ${p.merchantName}.`,
  },
};

/** Render a templated SMS body; throws on an unknown template (a caught mistake, not a silent empty send). */
export function renderSms(templateKey: string, params: Record<string, string>, locale: SmsLocale): string {
  const template = TEMPLATES[templateKey];
  if (!template) throw new Error(`Unknown SMS template "${templateKey}"`);
  return template[locale](params);
}
