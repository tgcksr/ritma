import { z } from 'zod';
import { optionalEmail, optionalText, paginationSchema, phoneSchema, requiredText } from './common';

export const customerInputSchema = z.object({
  fullName: requiredText(2, 120),
  phone: phoneSchema,
  email: optionalEmail,
  notes: optionalText(2000),
});

export type CustomerInput = z.output<typeof customerInputSchema>;
export type CustomerFormValues = z.input<typeof customerInputSchema>;

export const customerListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
});

export type CustomerListQuery = z.input<typeof customerListQuerySchema>;
