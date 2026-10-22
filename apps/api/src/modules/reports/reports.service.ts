import { ACTIVE_STATUSES, APPOINTMENT_STATUSES, DAY_MS, MINUTE_MS, reportQuerySchema } from '@ritma/shared';
import type { AppointmentStatus, ReportBucket, ReportQuery } from '@ritma/shared';
import { prisma } from '../../core/db';
import { AppError } from '../../core/errors';
import { appointmentInclude } from '../appointments/appointments.repository';

const MAX_RANGE_DAYS = 366;

const emptyBucket = (key: string): ReportBucket => ({ key, total: 0, completed: 0, active: 0, cancelled: 0 });

function addToBucket(bucket: ReportBucket, status: AppointmentStatus) {
  bucket.total++;
  if (status === 'COMPLETED') bucket.completed++;
  else if (status === 'CANCELLED') bucket.cancelled++;
  else bucket.active++;
}

export const reportsService = {
  async summary(rawQuery: ReportQuery) {
    const { from: fromIso, to: toIso, tzOffset } = reportQuerySchema.parse(rawQuery);
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const days = Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
    if (days <= 0 || days > MAX_RANGE_DAYS) throw new AppError(400, 'RANGE_TOO_LARGE', 'Invalid date range');

    // Shift UTC instants into the viewer's wall-clock time so days/hours bucket correctly.
    const toLocal = (date: Date) => new Date(date.getTime() - tzOffset * MINUTE_MS);
    const dayKey = (date: Date) => toLocal(date).toISOString().slice(0, 10);

    const [appointments, upcoming] = await Promise.all([
      prisma.appointment.findMany({
        where: { startAt: { gte: from, lt: to } },
        select: { startAt: true, status: true, priceCents: true, serviceId: true, service: { select: { name: true } } },
      }),
      prisma.appointment.findMany({
        where: { startAt: { gte: new Date() }, status: { in: [...ACTIVE_STATUSES] } },
        include: appointmentInclude,
        orderBy: { startAt: 'asc' },
        take: 6,
      }),
    ]);

    const totals = Object.fromEntries(APPOINTMENT_STATUSES.map((s) => [s, 0])) as Record<AppointmentStatus, number>;
    const revenue = { realizedCents: 0, expectedCents: 0 };
    const daily = new Map<string, ReportBucket>();
    for (let i = 0; i < days; i++) {
      const key = dayKey(new Date(from.getTime() + i * DAY_MS));
      daily.set(key, emptyBucket(key));
    }
    const hourly = Array.from({ length: 24 }, (_, h) => emptyBucket(String(h).padStart(2, '0')));
    const byService = new Map<string, { serviceId: string; name: string; count: number; completed: number; revenueCents: number }>();

    for (const a of appointments) {
      const status = a.status as AppointmentStatus;
      totals[status]++;
      if (status === 'COMPLETED') revenue.realizedCents += a.priceCents;
      if (ACTIVE_STATUSES.includes(status)) revenue.expectedCents += a.priceCents;

      const day = daily.get(dayKey(a.startAt));
      if (day) addToBucket(day, status);
      addToBucket(hourly[toLocal(a.startAt).getUTCHours()], status);

      const entry = byService.get(a.serviceId) ?? { serviceId: a.serviceId, name: a.service.name, count: 0, completed: 0, revenueCents: 0 };
      if (status !== 'CANCELLED') entry.count++;
      if (status === 'COMPLETED') {
        entry.completed++;
        entry.revenueCents += a.priceCents;
      }
      byService.set(a.serviceId, entry);
    }

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals: { ...totals, all: appointments.length },
      revenue,
      daily: [...daily.values()],
      hourly,
      byService: [...byService.values()].filter((s) => s.count > 0).sort((a, b) => b.count - a.count),
      upcoming,
    };
  },
};
