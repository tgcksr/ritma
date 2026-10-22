import { z } from 'zod';
import { optionalEmail, optionalPhone, requiredText } from './common';

export const staffInputSchema = z.object({
  fullName: requiredText(2, 120),
  phone: optionalPhone,
  email: optionalEmail,
  isActive: z.boolean().default(true),
  serviceIds: z.array(z.string().min(1)).max(200).default([]),
});

export type StaffInput = z.output<typeof staffInputSchema>;
export type StaffFormValues = z.input<typeof staffInputSchema>;
