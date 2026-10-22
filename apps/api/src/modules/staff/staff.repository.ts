import { prisma } from '../../core/db';

const withServiceIds = { services: { select: { serviceId: true } } } as const;

interface StaffData {
  fullName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export const staffRepository = {
  list() {
    return prisma.staff.findMany({ include: withServiceIds, orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }] });
  },

  findById(id: string) {
    return prisma.staff.findUnique({ where: { id }, include: withServiceIds });
  },

  countAppointments(staffId: string) {
    return prisma.appointment.count({ where: { staffId } });
  },

  create(data: StaffData, serviceIds: string[]) {
    return prisma.staff.create({
      data: { ...data, services: { create: serviceIds.map((serviceId) => ({ serviceId })) } },
      include: withServiceIds,
    });
  },

  update(id: string, data: StaffData, serviceIds: string[]) {
    return prisma.staff.update({
      where: { id },
      data: {
        ...data,
        services: { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) },
      },
      include: withServiceIds,
    });
  },

  delete(id: string) {
    return prisma.staff.delete({ where: { id } });
  },
};
