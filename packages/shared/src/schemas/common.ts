import { z } from 'zod';
import { normalizePhone } from '../text';

/** Validation messages are i18n keys, translated by the client. */
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

export const requiredText = (min: number, max: number) =>
  z
    .string({ required_error: 'validation.required' })
    .trim()
    .min(1, 'validation.required')
    .min(min, 'validation.minLength2')
    .max(max, 'validation.tooLong');

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'validation.tooLong')
    .nullish()
    .transform((value) => value || null);

export const optionalEmail = z
  .string()
  .trim()
  .max(254, 'validation.tooLong')
  .refine((value) => value === '' || z.string().email().safeParse(value).success, 'validation.email')
  .nullish()
  .transform((value) => value?.toLowerCase() || null);

export const phoneSchema = z
  .string({ required_error: 'validation.required' })
  .trim()
  .min(1, 'validation.required')
  .regex(PHONE_PATTERN, 'validation.phone')
  .transform(normalizePhone);

export const optionalPhone = z
  .string()
  .trim()
  .refine((value) => value === '' || PHONE_PATTERN.test(value), 'validation.phone')
  .nullish()
  .transform((value) => (value ? normalizePhone(value) : null));

export const isoDateTime = z.string().datetime({ offset: true, message: 'validation.datetime' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({ id: z.string().min(1) });
