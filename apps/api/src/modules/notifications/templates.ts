import type { NotificationKind } from '@ritma/shared';

export interface ReminderData {
  customerName: string;
  serviceName: string;
  staffName: string | null;
  startAt: Date;
  businessName: string;
  timeZone: string;
}

type Locale = 'tr' | 'en';
type Lead = 'today' | 'tomorrow' | 'soon';

const LOCALE_TAG: Record<Locale, string> = { tr: 'tr-TR', en: 'en-GB' };

interface Formatted extends Omit<ReminderData, 'startAt' | 'timeZone'> {
  lead: string;
  date: string;
  time: string;
}

const TEMPLATES: Record<Locale, { subject: string; lead: Record<Lead, string>; body: (d: Formatted) => string }> = {
  tr: {
    subject: 'Randevu hatırlatması',
    lead: { today: 'bugün', tomorrow: 'yarın', soon: 'yaklaşık 1 saat sonra' },
    body: (d) =>
      `Merhaba ${d.customerName}, ${d.lead} (${d.date} ${d.time}) ${d.serviceName} randevunuz bulunmaktadır` +
      `${d.staffName ? ` (${d.staffName})` : ''}. Görüşmek üzere! - ${d.businessName}`,
  },
  en: {
    subject: 'Appointment reminder',
    lead: { today: 'today', tomorrow: 'tomorrow', soon: 'in about 1 hour' },
    body: (d) =>
      `Hi ${d.customerName}, this is a reminder of your ${d.serviceName} appointment ${d.lead} (${d.date} ${d.time})` +
      `${d.staffName ? ` with ${d.staffName}` : ''}. See you soon! - ${d.businessName}`,
  },
};

/** Calendar day (YYYY-MM-DD) of an instant in the business time zone. */
const dayIn = (date: Date, timeZone: string) => date.toLocaleDateString('en-CA', { timeZone });

export function renderReminder(locale: Locale, kind: NotificationKind, data: ReminderData, now: Date) {
  const template = TEMPLATES[locale];
  const tag = LOCALE_TAG[locale];
  const lead: Lead =
    kind === 'REMINDER_1H' ? 'soon' : dayIn(data.startAt, data.timeZone) === dayIn(now, data.timeZone) ? 'today' : 'tomorrow';

  const formatted: Formatted = {
    ...data,
    lead: template.lead[lead],
    date: data.startAt.toLocaleDateString(tag, { day: '2-digit', month: 'long', timeZone: data.timeZone }),
    time: data.startAt.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit', timeZone: data.timeZone }),
  };
  return { subject: template.subject, body: template.body(formatted) };
}
