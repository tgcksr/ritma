import { z } from 'zod';
import { requiredText } from './common';

export const serviceInputSchema = z.object({
  name: requiredText(2, 100),
  durationMin: z
    .number({ invalid_type_error: 'validation.number', required_error: 'validation.required' })
    .int('validation.integer')
    .min(5, 'validation.durationMin')
    .max(600, 'validation.durationMax'),
  priceCents: z
    .number({ invalid_type_error: 'validation.number', required_error: 'validation.required' })
    .int('validation.integer')
    .min(0, 'validation.nonNegative')
    .max(100_000_000, 'validation.tooLarge'),
  isActive: z.boolean().default(true),
});

export type ServiceInput = z.output<typeof serviceInputSchema>;
