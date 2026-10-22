import type { NotificationService } from './notifications.service';
import type { Logger } from './providers/notification-provider';

/** Polls for due reminders. Returns a stop function. Overlapping ticks are skipped. */
export function startReminderJob(service: NotificationService, intervalMs: number, log: Logger): () => void {
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const sent = await service.processDueReminders();
      if (sent > 0) log.info({ sent }, 'Reminder job sent notifications');
    } catch (error) {
      log.error({ err: error }, 'Reminder job failed');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  void tick();
  return () => clearInterval(timer);
}
