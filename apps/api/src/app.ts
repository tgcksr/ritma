import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { AUTH_COOKIE } from '@ritma/shared';
import { authenticate } from './core/auth';
import { config } from './core/config';
import { prisma } from './core/db';
import { errorHandler } from './core/error-handler';
import { appointmentRoutes } from './modules/appointments/appointments.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { customerRoutes } from './modules/customers/customers.routes';
import { createNotificationService } from './modules/notifications/notifications.service';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { MockEmailProvider } from './modules/notifications/providers/mock-email.provider';
import { MockSmsProvider } from './modules/notifications/providers/mock-sms.provider';
import { startReminderJob } from './modules/notifications/reminder.job';
import { reportRoutes } from './modules/reports/reports.routes';
import { serviceRoutes } from './modules/services/services.routes';
import { staffRoutes } from './modules/staff/staff.routes';

const WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url));

export interface BuildAppOptions {
  logger?: FastifyServerOptions['logger'];
  startJobs?: boolean;
}

export async function buildApp({ logger = true, startJobs = false }: BuildAppOptions = {}) {
  const app = Fastify({ logger });
  app.setErrorHandler(errorHandler);

  await app.register(cookie);
  await app.register(jwt, { secret: config.jwtSecret, cookie: { cookieName: AUTH_COOKIE, signed: false } });
  await app.register(rateLimit, {
    global: false,
    errorResponseBuilder: (_request, context) => ({
      statusCode: context.statusCode,
      code: 'RATE_LIMITED',
      message: `Too many requests, retry in ${context.after}`,
    }),
  });

  const notifications = createNotificationService({
    providers: [new MockSmsProvider(app.log), new MockEmailProvider(app.log)],
    log: app.log,
    locale: config.notifyLocale,
    businessName: config.businessName,
    timeZone: config.businessTimeZone,
  });

  app.get('/api/health', async () => ({ status: 'ok' }));
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Everything below requires a valid session.
  await app.register(async (secured) => {
    secured.addHook('onRequest', authenticate);
    await secured.register(customerRoutes, { prefix: '/api/customers' });
    await secured.register(serviceRoutes, { prefix: '/api/services' });
    await secured.register(staffRoutes, { prefix: '/api/staff' });
    await secured.register(appointmentRoutes, { prefix: '/api/appointments' });
    await secured.register(reportRoutes, { prefix: '/api/reports' });
    await secured.register(notificationRoutes, { prefix: '/api/notifications', service: notifications });
  });

  // In production the API also serves the built SPA (apps/web/dist).
  if (config.isProd && existsSync(WEB_DIST)) {
    await app.register(fastifyStatic, { root: WEB_DIST });
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) return reply.sendFile('index.html');
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
    });
  }

  if (startJobs && config.remindersEnabled) {
    const stop = startReminderJob(notifications, config.reminderIntervalMs, app.log);
    app.addHook('onClose', async () => stop());
  }
  app.addHook('onClose', async () => prisma.$disconnect());

  return app;
}
