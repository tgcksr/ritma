import type { FastifyPluginAsync } from 'fastify';
import { appointmentInputSchema, appointmentStatusUpdateSchema, idParamSchema } from '@ritma/shared';
import type { AppointmentListQuery } from '@ritma/shared';
import { appointmentsService } from './appointments.service';

export const appointmentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => appointmentsService.list(request.query as AppointmentListQuery));

  app.get('/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return appointmentsService.get(id);
  });

  app.post('/', async (request, reply) => {
    const appointment = await appointmentsService.create(appointmentInputSchema.parse(request.body));
    return reply.status(201).send(appointment);
  });

  app.put('/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return appointmentsService.update(id, appointmentInputSchema.parse(request.body));
  });

  app.patch('/:id/status', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const { status } = appointmentStatusUpdateSchema.parse(request.body);
    return appointmentsService.changeStatus(id, status);
  });
};
