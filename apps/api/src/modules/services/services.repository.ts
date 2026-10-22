import type { Prisma } from '@prisma/client';
import { prisma } from '../../core/db';

export const servicesRepository = {
  list() {
    return prisma.service.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  },

  findById(id: string) {
    return prisma.service.findUnique({ where: { id } });
  },

  countByIds(ids: string[]) {
    return prisma.service.count({ where: { id: { in: ids } } });
  },

  countAppointments(serviceId: string) {
    return prisma.appointment.count({ where: { serviceId } });
  },

  create(data: Prisma.ServiceCreateInput) {
    return prisma.service.create({ data });
  },

  update(id: string, data: Prisma.ServiceUpdateInput) {
    return prisma.service.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.service.delete({ where: { id } });
  },
};
