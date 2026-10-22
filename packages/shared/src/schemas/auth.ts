import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required').max(200, 'validation.tooLong'),
});

export type LoginInput = z.output<typeof loginSchema>;
