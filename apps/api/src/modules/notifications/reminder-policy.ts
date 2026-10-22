import { MINUTE_MS, type NotificationKind } from '@ritma/shared';

export const REMINDER_LOOKAHEAD_MIN = 24 * 60;

/**
 * Which reminder is due for an appointment starting at `startAt`, evaluated at `now`.
 * - more than 24h away: none yet
 * - within 24h (but > 1h): the 24h reminder
 * - within 1h: the 1h reminder
 * Bookings made at short notice therefore only get the reminders that still make sense.
 */
export function dueReminderKind(startAt: Date, now: Date): NotificationKind | null {
  const minutesLeft = (startAt.getTime() - now.getTime()) / MINUTE_MS;
  if (minutesLeft <= 0 || minutesLeft > REMINDER_LOOKAHEAD_MIN) return null;
  return minutesLeft <= 60 ? 'REMINDER_1H' : 'REMINDER_24H';
}
