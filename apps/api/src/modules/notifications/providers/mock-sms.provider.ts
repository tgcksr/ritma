import { randomUUID } from 'node:crypto';
import type { Logger, NotificationProvider, OutgoingMessage } from './notification-provider';

/** Logs instead of sending. Every "sent" message is also persisted in NotificationLog. */
export class MockSmsProvider implements NotificationProvider {
  readonly channel = 'SMS' as const;

  constructor(private readonly log: Logger) {}

  async send(message: OutgoingMessage) {
    this.log.info({ to: message.to, body: message.body }, '[MOCK SMS] message sent');
    return { providerMessageId: `mock-sms-${randomUUID()}` };
  }
}
