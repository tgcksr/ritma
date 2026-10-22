import type { ServiceInput } from '@ritma/shared';
import { conflict, notFound } from '../../core/errors';
import { servicesRepository } from './services.repository';

async function getOrThrow(id: string) {
  const service = await servicesRepository.findById(id);
  if (!service) throw notFound('Service');
  return service;
}

export const servicesService = {
  list: () => servicesRepository.list(),

  create: (input: ServiceInput) => servicesRepository.create(input),

  async update(id: string, input: ServiceInput) {
    await getOrThrow(id);
    return servicesRepository.update(id, input);
  },

  async remove(id: string) {
    await getOrThrow(id);
    if ((await servicesRepository.countAppointments(id)) > 0) {
      throw conflict('SERVICE_IN_USE', 'Service has appointments; deactivate it instead');
    }
    await servicesRepository.delete(id);
  },
};
