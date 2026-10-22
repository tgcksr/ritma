import { randomUUID } from 'node:crypto';
import type { Logger, NotificationProvider, OutgoingMessage } from './notification-provider';

/** Logs instead of sending. Every "sent" message is also persisted in NotificationLog. */
export class MockEmailProvider implements NotificationProvider {
  readonly channel = 'EMAIL' as const;

  constructor(private readonly log: Logger) {}

  async send(message: OutgoingMessage) {
    this.log.info({ to: message.to, subject: message.subject, body: message.body }, '[MOCK EMAIL] message sent');
    return { providerMessageId: `mock-email-${randomUUID()}` };
  }
}
