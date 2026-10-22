import type { Prisma } from '@prisma/client';
import { BLOCKING_STATUSES } from '@ritma/shared';
import type { AppointmentStatus } from '@ritma/shared';
import { prisma, type Db } from '../../core/db';

export const appointmentInclude = {
  customer: { select: { id: true, fullName: true, phone: true } },
  service: { select: { id: true, name: true, durationMin: true } },
  staff: { select: { id: true, fullName: true } },
} satisfies Prisma.AppointmentInclude;

export interface AppointmentFilter {
  from: Date;
  to: Date;
  staffId?: string;
  customerId?: string;
  status?: AppointmentStatus;
}

export interface OverlapQuery {
  start: Date;
  end: Date;
  staffId?: string;
  customerId?: string;
  excludeId?: string;
}

export const appointmentsRepository = {
  list(filter: AppointmentFilter) {
    return prisma.appointment.findMany({
      where: {
        startAt: { lt: filter.to },
        endAt: { gt: filter.from },
        staffId: filter.staffId,
        customerId: filter.customerId,
        status: filter.status,
      },
      include: appointmentInclude,
      orderBy: { startAt: 'asc' },
    });
  },

  findById(id: string, db: Db = prisma) {
    return db.appointment.findUnique({ where: { id }, include: appointmentInclude });
  },

  /** First slot-blocking appointment overlapping [start, end) for the given staff or customer. */
  findOverlapping(db: Db, query: OverlapQuery) {
    return db.appointment.findFirst({
      where: {
        id: query.excludeId ? { not: query.excludeId } : undefined,
        staffId: query.staffId,
        customerId: query.customerId,
        status: { in: [...BLOCKING_STATUSES] },
        startAt: { lt: query.end },
        endAt: { gt: query.start },
      },
      select: { id: true, startAt: true, endAt: true },
    });
  },

  create(db: Db, data: Prisma.AppointmentUncheckedCreateInput) {
    return db.appointment.create({ data, include: appointmentInclude });
  },

  update(db: Db, id: string, data: Prisma.AppointmentUncheckedUpdateInput) {
    return db.appointment.update({ where: { id }, data, include: appointmentInclude });
  },

  clearReminders(db: Db, appointmentId: string) {
    return db.notificationLog.deleteMany({ where: { appointmentId } });
  },
};
