import type { FastifyRequest } from 'fastify';
import { AppError } from './errors';

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  role: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: SessionUser;
    user: SessionUser;
  }
}

/** onRequest hook: verifies the session cookie and populates `request.user`. */
export async function authenticate(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
}
