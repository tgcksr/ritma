import type { FastifyPluginAsync } from 'fastify';
import { idParamSchema, serviceInputSchema } from '@ritma/shared';
import { servicesService } from './services.service';

export const serviceRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => servicesService.list());

  app.post('/', async (request, reply) => {
    const service = await servicesService.create(serviceInputSchema.parse(request.body));
    return reply.status(201).send(service);
  });

  app.put('/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return servicesService.update(id, serviceInputSchema.parse(request.body));
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await servicesService.remove(id);
    return reply.status(204).send();
  });
};
