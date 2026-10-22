import type { FastifyPluginAsync } from 'fastify';
import { AUTH_COOKIE, loginSchema } from '@ritma/shared';
import { authenticate } from '../../core/auth';
import { config } from '../../core/config';
import { authService } from './auth.service';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await authService.login(email, password);

    const token = await reply.jwtSign(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      { expiresIn: `${config.sessionHours}h` },
    );
    reply.setCookie(AUTH_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProd,
      maxAge: config.sessionHours * 3600,
    });
    return { user };
  });

  app.get('/me', { onRequest: authenticate }, async (request) => ({
    user: await authService.getUser(request.user.sub),
  }));

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie(AUTH_COOKIE, { path: '/' });
    return { ok: true };
  });
};
