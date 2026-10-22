import type { Prisma } from '@prisma/client';
import { prisma } from '../../core/db';
import { appointmentInclude } from '../appointments/appointments.repository';

type CustomerData = Omit<Prisma.CustomerCreateInput, 'appointments'>;

export const customersRepository = {
  async list(params: { searchKey?: string; phone?: string; skip: number; take: number }) {
    const or: Prisma.CustomerWhereInput[] = [];
    if (params.searchKey) or.push({ searchKey: { contains: params.searchKey } });
    if (params.phone) or.push({ phone: { contains: params.phone } });
    const where: Prisma.CustomerWhereInput = or.length ? { OR: or } : {};

    const [rows, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: params.skip,
        take: params.take,
        include: {
          _count: { select: { appointments: true } },
          appointments: { select: { startAt: true }, orderBy: { startAt: 'desc' }, take: 1 },
        },
      }),
      prisma.customer.count({ where }),
    ]);
    return { rows, total };
  },

  findById(id: string) {
    return prisma.customer.findUnique({ where: { id } });
  },

  findByPhone(phone: string) {
    return prisma.customer.findUnique({ where: { phone } });
  },

  findWithHistory(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: { appointments: { include: appointmentInclude, orderBy: { startAt: 'desc' } } },
    });
  },

  create(data: CustomerData) {
    return prisma.customer.create({ data });
  },

  update(id: string, data: CustomerData) {
    return prisma.customer.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.customer.delete({ where: { id } });
  },
};
