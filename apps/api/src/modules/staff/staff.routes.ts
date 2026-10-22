import type { FastifyPluginAsync } from 'fastify';
import { idParamSchema, staffInputSchema } from '@ritma/shared';
import { staffService } from './staff.service';

export const staffRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => staffService.list());

  app.post('/', async (request, reply) => {
    const staff = await staffService.create(staffInputSchema.parse(request.body));
    return reply.status(201).send(staff);
  });

  app.put('/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return staffService.update(id, staffInputSchema.parse(request.body));
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await staffService.remove(id);
    return reply.status(204).send();
  });
};
