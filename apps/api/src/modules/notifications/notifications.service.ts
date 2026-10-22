import { Prisma } from '@prisma/client';
import { addMinutes, paginationSchema } from '@ritma/shared';
import { notificationsRepository } from './notifications.repository';
import type { Logger, NotificationProvider } from './providers/notification-provider';
import { dueReminderKind, REMINDER_LOOKAHEAD_MIN } from './reminder-policy';
import { renderReminder } from './templates';

export interface NotificationServiceDeps {
  providers: NotificationProvider[];
  log: Logger;
  locale: 'tr' | 'en';
  businessName: string;
  timeZone: string;
  now?: () => Date;
}

export type NotificationService = ReturnType<typeof createNotificationService>;

export function createNotificationService(deps: NotificationServiceDeps) {
  const now = deps.now ?? (() => new Date());

  return {
    /** Sends every reminder that is due and not yet sent. Returns how many messages were sent. */
    async processDueReminders(): Promise<number> {
      const current = now();
      const candidates = await notificationsRepository.findReminderCandidates(
        current,
        addMinutes(current, REMINDER_LOOKAHEAD_MIN),
      );

      let sent = 0;
      for (const appointment of candidates) {
        const kind = dueReminderKind(appointment.startAt, current);
        if (!kind) continue;

        const message = renderReminder(deps.locale, kind, {
          customerName: appointment.customer.fullName,
          serviceName: appointment.service.name,
          staffName: appointment.staff?.fullName ?? null,
          startAt: appointment.startAt,
          businessName: deps.businessName,
          timeZone: deps.timeZone,
        }, current);

        for (const provider of deps.providers) {
          const recipient = provider.channel === 'SMS' ? appointment.customer.phone : appointment.customer.email;
          if (!recipient) continue;
          const alreadySent = appointment.notifications.some((n) => n.kind === kind && n.channel === provider.channel);
          if (alreadySent) continue;

          try {
            const receipt = await provider.send({ to: recipient, ...message });
            await notificationsRepository.createLog({
              appointmentId: appointment.id,
              channel: provider.channel,
              kind,
              recipient,
              subject: provider.channel === 'EMAIL' ? message.subject : null,
              body: message.body,
              providerMessageId: receipt.providerMessageId,
            });
            sent++;
          } catch (error) {
            // Unique violation = another worker logged it first; anything else is retried next tick.
            const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
            if (!duplicate) deps.log.error({ err: error, appointmentId: appointment.id }, 'Reminder delivery failed');
          }
        }
      }
      return sent;
    },

    async list(query: { appointmentId?: string; page?: unknown; pageSize?: unknown }) {
      const { page, pageSize } = paginationSchema.parse(query);
      const { items, total } = await notificationsRepository.list({
        appointmentId: query.appointmentId || undefined,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      return { items, total, page, pageSize };
    },
  };
}
