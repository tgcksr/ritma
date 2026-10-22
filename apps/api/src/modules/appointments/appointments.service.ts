import { Prisma, type Appointment } from '@prisma/client';
import {
  addMinutes,
  appointmentListQuerySchema,
  canTransition,
  isEditableStatus,
  type AppointmentInput,
  type AppointmentListQuery,
  type AppointmentStatus,
} from '@ritma/shared';
import { prisma, type Db } from '../../core/db';
import { AppError, conflict, notFound, unprocessable } from '../../core/errors';
import { appointmentsRepository } from './appointments.repository';

const MAX_LIST_RANGE_DAYS = 366;
const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

/**
 * Validates the referenced customer/service/staff and computes the slot.
 * Inactive services/staff are rejected only when newly chosen, so existing bookings stay editable.
 */
async function resolveSlot(db: Db, input: AppointmentInput, existing?: Appointment) {
  const [customer, service, staff] = await Promise.all([
    db.customer.findUnique({ where: { id: input.customerId }, select: { id: true } }),
    db.service.findUnique({ where: { id: input.serviceId } }),
    input.staffId ? db.staff.findUnique({ where: { id: input.staffId } }) : null,
  ]);

  if (!customer) throw notFound('Customer');
  if (!service) throw notFound('Service');
  if (!service.isActive && existing?.serviceId !== service.id) {
    throw unprocessable('SERVICE_INACTIVE', 'Service is not active');
  }

  if (input.staffId) {
    if (!staff) throw notFound('Staff');
    if (!staff.isActive && existing?.staffId !== staff.id) {
      throw unprocessable('STAFF_INACTIVE', 'Staff member is not active');
    }
    const qualified = await db.staffService.findUnique({
      where: { staffId_serviceId: { staffId: staff.id, serviceId: service.id } },
    });
    if (!qualified) throw unprocessable('STAFF_NOT_QUALIFIED', 'Staff member does not provide this service');
  }

  const start = new Date(input.startAt);
  const end = addMinutes(start, service.durationMin);
  return { service, start, end };
}

/** Smart conflict check: the same staff member or the same customer can't be in two places at once. */
async function assertNoConflict(
  db: Db,
  slot: { start: Date; end: Date; staffId: string | null; customerId: string; excludeId?: string },
) {
  const { start, end, excludeId } = slot;

  if (slot.staffId) {
    const clash = await appointmentsRepository.findOverlapping(db, { start, end, excludeId, staffId: slot.staffId });
    if (clash) throw conflict('STAFF_BUSY', 'Staff member already has an appointment at this time', { conflictWith: clash });
  }

  const clash = await appointmentsRepository.findOverlapping(db, { start, end, excludeId, customerId: slot.customerId });
  if (clash) throw conflict('CUSTOMER_BUSY', 'Customer already has an appointment at this time', { conflictWith: clash });
}

export const appointmentsService = {
  list(rawQuery: AppointmentListQuery) {
    const query = appointmentListQuerySchema.parse(rawQuery);
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from || to.getTime() - from.getTime() > MAX_LIST_RANGE_DAYS * 86_400_000) {
      throw new AppError(400, 'RANGE_TOO_LARGE', 'Invalid date range');
    }
    return appointmentsRepository.list({ ...query, from, to });
  },

  async get(id: string) {
    const appointment = await appointmentsRepository.findById(id);
    if (!appointment) throw notFound('Appointment');
    return appointment;
  },

  create(input: AppointmentInput) {
    // Check + insert inside one transaction so two concurrent bookings can't both pass the check.
    return prisma.$transaction(async (tx) => {
      const { service, start, end } = await resolveSlot(tx, input);
      await assertNoConflict(tx, { start, end, staffId: input.staffId, customerId: input.customerId });

      return appointmentsRepository.create(tx, {
        customerId: input.customerId,
        serviceId: service.id,
        staffId: input.staffId,
        startAt: start,
        endAt: end,
        status: 'PENDING',
        priceCents: service.priceCents,
        notes: input.notes,
      });
    }, SERIALIZABLE);
  },

  update(id: string, input: AppointmentInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findUnique({ where: { id } });
      if (!existing) throw notFound('Appointment');
      if (!isEditableStatus(existing.status as AppointmentStatus)) {
        throw unprocessable('NOT_EDITABLE', 'Completed or cancelled appointments cannot be edited');
      }

      const { service, start, end } = await resolveSlot(tx, input, existing);
      await assertNoConflict(tx, { start, end, staffId: input.staffId, customerId: input.customerId, excludeId: id });

      const rescheduled = existing.startAt.getTime() !== start.getTime() || existing.customerId !== input.customerId;
      if (rescheduled) await appointmentsRepository.clearReminders(tx, id);

      return appointmentsRepository.update(tx, id, {
        customerId: input.customerId,
        serviceId: service.id,
        staffId: input.staffId,
        startAt: start,
        endAt: end,
        // Keep the booked price unless the service itself changed.
        priceCents: existing.serviceId === service.id ? existing.priceCents : service.priceCents,
        notes: input.notes,
      });
    }, SERIALIZABLE);
  },

  async changeStatus(id: string, status: AppointmentStatus) {
    const existing = await appointmentsRepository.findById(id);
    if (!existing) throw notFound('Appointment');

    const current = existing.status as AppointmentStatus;
    if (current === status) return existing;
    if (!canTransition(current, status)) {
      throw unprocessable('INVALID_TRANSITION', `Cannot change status from ${current} to ${status}`, {
        from: current,
        to: status,
      });
    }
    return appointmentsRepository.update(prisma, id, { status });
  },
};
