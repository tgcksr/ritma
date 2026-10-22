import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@ritma/shared';
import { AppError } from './errors';

function send(reply: FastifyReply, status: number, error: ApiErrorBody['error']) {
  return reply.status(status).send({ error } satisfies ApiErrorBody);
}

export function errorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return send(reply, 400, { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() });
  }

  if (error instanceof AppError) {
    return send(reply, error.statusCode, { code: error.code, message: error.message, details: error.details });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return send(reply, 409, { code: 'UNIQUE_VIOLATION', message: 'Record already exists', details: error.meta });
      case 'P2003':
        return send(reply, 409, { code: 'IN_USE', message: 'Record is referenced by other records' });
      case 'P2025':
        return send(reply, 404, { code: 'NOT_FOUND', message: 'Record not found' });
    }
  }

  // Fastify / plugin errors (bad JSON, rate limit, payload too large, ...)
  const statusCode = (error as { statusCode?: number }).statusCode;
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    const { code, message } = error as { code?: string; message?: string };
    return send(reply, statusCode, { code: code ?? 'BAD_REQUEST', message: message ?? 'Bad request' });
  }

  request.log.error(error);
  return send(reply, 500, { code: 'INTERNAL_ERROR', message: 'Something went wrong' });
}
