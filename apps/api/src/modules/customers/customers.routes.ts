import type { FastifyPluginAsync } from 'fastify';
import { customerInputSchema, idParamSchema } from '@ritma/shared';
import type { CustomerListQuery } from '@ritma/shared';
import { customersService } from './customers.service';

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => customersService.list(request.query as CustomerListQuery));

  app.get('/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return customersService.getDetail(id);
  });

  app.post('/', async (request, reply) => {
    const customer = await customersService.create(customerInputSchema.parse(request.body));
    return reply.status(201).send(customer);
  });

  app.put('/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return customersService.update(id, customerInputSchema.parse(request.body));
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await customersService.remove(id);
    return reply.status(204).send();
  });
};
