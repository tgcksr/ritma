import type { FastifyPluginAsync } from 'fastify';
import type { NotificationService } from './notifications.service';

export const notificationRoutes: FastifyPluginAsync<{ service: NotificationService }> = async (app, { service }) => {
  app.get('/', async (request) =>
    service.list(request.query as { appointmentId?: string; page?: string; pageSize?: string }),
  );

  /** Manually triggers a reminder scan (the background job does this every minute). */
  app.post('/run', async () => ({ sent: await service.processDueReminders() }));
};
