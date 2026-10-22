import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addMinutes } from '@ritma/shared';
import { createNotificationService } from '../src/modules/notifications/notifications.service';
import type { NotificationProvider, OutgoingMessage } from '../src/modules/notifications/providers/notification-provider';
import { dueReminderKind } from '../src/modules/notifications/reminder-policy';
import { renderReminder } from '../src/modules/notifications/templates';
import { client, createFixtures, createTestApp } from './helpers';

describe('renderReminder', () => {
  const data = {
    customerName: 'Ali',
    serviceName: 'Kesim',
    staffName: null,
    startAt: new Date('2030-01-01T20:00:00Z'), // 23:00 Istanbul
    businessName: 'Test',
    timeZone: 'Europe/Istanbul',
  };

  it('says "today" for a same-day 24h reminder and "tomorrow" otherwise', () => {
    expect(renderReminder('en', 'REMINDER_24H', data, new Date('2030-01-01T05:00:00Z')).body).toContain('today');
    expect(renderReminder('en', 'REMINDER_24H', data, new Date('2029-12-31T20:30:00Z')).body).toContain('tomorrow');
    expect(renderReminder('tr', 'REMINDER_1H', data, new Date('2030-01-01T19:30:00Z')).body).toContain('1 saat sonra');
  });
});

describe('dueReminderKind', () => {
  const now = new Date('2030-01-01T12:00:00Z');

  it('picks the right reminder window', () => {
    expect(dueReminderKind(addMinutes(now, 25 * 60), now)).toBeNull();
    expect(dueReminderKind(addMinutes(now, 23 * 60), now)).toBe('REMINDER_24H');
    expect(dueReminderKind(addMinutes(now, 61), now)).toBe('REMINDER_24H');
    expect(dueReminderKind(addMinutes(now, 45), now)).toBe('REMINDER_1H');
    expect(dueReminderKind(addMinutes(now, -5), now)).toBeNull();
  });
});

class RecordingProvider implements NotificationProvider {
  sent: OutgoingMessage[] = [];
  constructor(readonly channel: 'SMS' | 'EMAIL') {}
  async send(message: OutgoingMessage) {
    this.sent.push(message);
    return { providerMessageId: `test-${this.sent.length}` };
  }
}

describe('processDueReminders', () => {
  let app: FastifyInstance;
  let api: ReturnType<typeof client>;
  let f: Awaited<ReturnType<typeof createFixtures>>;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    api = client(app, ctx.cookie);
    f = await createFixtures(api);
  });

  afterAll(() => app.close());

  it('sends each reminder once per channel and skips missing contact info', async () => {
    const startAt = new Date('2031-06-01T09:00:00Z');
    // customer2 has phone + e-mail, customer1 only a phone
    await api.post('/api/appointments', { customerId: f.customer2.id, serviceId: f.service.id, startAt: startAt.toISOString() });
    await api.post('/api/appointments', { customerId: f.customer1.id, serviceId: f.service.id, startAt: startAt.toISOString() });

    const sms = new RecordingProvider('SMS');
    const email = new RecordingProvider('EMAIL');
    let now = addMinutes(startAt, -20 * 60);
    const service = createNotificationService({
      providers: [sms, email],
      log: { info() {}, error() {} },
      locale: 'tr',
      businessName: 'Test',
      timeZone: 'Europe/Istanbul',
      now: () => now,
    });

    expect(await service.processDueReminders()).toBe(3); // 2 SMS + 1 e-mail
    expect(await service.processDueReminders()).toBe(0); // idempotent
    expect(sms.sent[0].body).toContain('Kesim');
    expect(sms.sent[0].body).toContain('yarın'); // now is 16:00 the day before (Istanbul)

    now = addMinutes(startAt, -30);
    expect(await service.processDueReminders()).toBe(3); // 1h reminders
    expect(email.sent[1].subject).toBe('Randevu hatırlatması');
  });
});
