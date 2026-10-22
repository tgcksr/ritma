import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '../constants';
import { isoDateTime, optionalText } from './common';

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const appointmentInputSchema = z.object({
  customerId: z.string({ required_error: 'validation.required' }).min(1, 'validation.required'),
  serviceId: z.string({ required_error: 'validation.required' }).min(1, 'validation.required'),
  staffId: z
    .string()
    .nullish()
    .transform((value) => value || null),
  startAt: isoDateTime,
  notes: optionalText(1000),
});

export type AppointmentInput = z.output<typeof appointmentInputSchema>;

export const appointmentStatusUpdateSchema = z.object({ status: appointmentStatusSchema });

export const appointmentListQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  staffId: z.string().optional(),
  customerId: z.string().optional(),
  status: appointmentStatusSchema.optional(),
});

export type AppointmentListQuery = z.input<typeof appointmentListQuerySchema>;
