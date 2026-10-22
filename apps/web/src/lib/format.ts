import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const CURRENCY = import.meta.env.VITE_CURRENCY ?? 'TRY';

export const localeTag = (language: string) => (language.startsWith('tr') ? 'tr-TR' : 'en-GB');

/** Locale-aware formatters that follow the selected UI language. */
export function useFormatters() {
  const { i18n } = useTranslation();
  const tag = localeTag(i18n.language);

  return useMemo(() => {
    const money = new Intl.NumberFormat(tag, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 });
    const moneyShort = new Intl.NumberFormat(tag, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 });
    const date = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' });
    const dateLong = new Intl.DateTimeFormat(tag, { weekday: 'long', day: 'numeric', month: 'long' });
    const dayShort = new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric' });
    const time = new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit' });
    const dateTime = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return {
      money: (cents: number) => money.format(cents / 100),
      moneyShort: (cents: number) => moneyShort.format(cents / 100),
      date: (value: string | Date) => date.format(new Date(value)),
      dateLong: (value: string | Date) => dateLong.format(new Date(value)),
      dayShort: (value: string | Date) => dayShort.format(new Date(value)),
      time: (value: string | Date) => time.format(new Date(value)),
      dateTime: (value: string | Date) => dateTime.format(new Date(value)),
      timeRange: (start: string | Date, end: string | Date) => `${time.format(new Date(start))} – ${time.format(new Date(end))}`,
      number: (value: number) => value.toLocaleString(tag),
    };
  }, [tag]);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` in local time, for <input type="date">. */
export const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** `HH:mm` in local time, for <input type="time">. */
export const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const fromDateTimeInputs = (date: string, time: string) => new Date(`${date}T${time}:00`);
