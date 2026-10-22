import type { Prisma } from '@prisma/client';
import { ACTIVE_STATUSES } from '@ritma/shared';
import { prisma } from '../../core/db';

export const notificationsRepository = {
  findReminderCandidates(from: Date, until: Date) {
    return prisma.appointment.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] }, startAt: { gt: from, lte: until } },
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        service: { select: { name: true } },
        staff: { select: { fullName: true } },
        notifications: { select: { channel: true, kind: true } },
      },
    });
  },

  createLog(data: Prisma.NotificationLogUncheckedCreateInput) {
    return prisma.notificationLog.create({ data });
  },

  async list(params: { appointmentId?: string; skip: number; take: number }) {
    const where: Prisma.NotificationLogWhereInput = { appointmentId: params.appointmentId };
    const [items, total] = await prisma.$transaction([
      prisma.notificationLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: {
          appointment: { select: { id: true, startAt: true, customer: { select: { id: true, fullName: true } } } },
        },
      }),
      prisma.notificationLog.count({ where }),
    ]);
    return { items, total };
  },
};
