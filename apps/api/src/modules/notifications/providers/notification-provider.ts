import type { NotificationChannel } from '@ritma/shared';

export interface OutgoingMessage {
  to: string;
  subject?: string;
  body: string;
}

export interface DeliveryReceipt {
  providerMessageId: string;
}

/**
 * Delivery channel abstraction. Swap a mock for a real gateway (Twilio, Netgsm, SMTP, SES...)
 * by implementing this interface and registering it in app.ts.
 */
export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(message: OutgoingMessage): Promise<DeliveryReceipt>;
}

export interface Logger {
  info(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
}
