import type { StaffInput } from '@ritma/shared';
import { conflict, notFound, unprocessable } from '../../core/errors';
import { servicesRepository } from '../services/services.repository';
import { staffRepository } from './staff.repository';

type StaffRow = NonNullable<Awaited<ReturnType<typeof staffRepository.findById>>>;

const toDTO = ({ services, ...staff }: StaffRow) => ({ ...staff, serviceIds: services.map((s) => s.serviceId) });

async function validatedServiceIds(serviceIds: string[]) {
  const unique = [...new Set(serviceIds)];
  if (unique.length && (await servicesRepository.countByIds(unique)) !== unique.length) {
    throw unprocessable('INVALID_SERVICE', 'One or more services do not exist');
  }
  return unique;
}

async function getOrThrow(id: string) {
  const staff = await staffRepository.findById(id);
  if (!staff) throw notFound('Staff');
  return staff;
}

export const staffService = {
  async list() {
    return (await staffRepository.list()).map(toDTO);
  },

  async create({ serviceIds, ...data }: StaffInput) {
    return toDTO(await staffRepository.create(data, await validatedServiceIds(serviceIds)));
  },

  async update(id: string, { serviceIds, ...data }: StaffInput) {
    await getOrThrow(id);
    return toDTO(await staffRepository.update(id, data, await validatedServiceIds(serviceIds)));
  },

  async remove(id: string) {
    await getOrThrow(id);
    if ((await staffRepository.countAppointments(id)) > 0) {
      throw conflict('STAFF_IN_USE', 'Staff member has appointments; deactivate instead');
    }
    await staffRepository.delete(id);
  },
};
