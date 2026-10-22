import { z } from 'zod';
import { isoDateTime } from './common';

export const reportQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  /** Client's `Date#getTimezoneOffset()` so days and hours are bucketed in the viewer's local time. */
  tzOffset: z.coerce.number().int().min(-840).max(840).default(0),
});

export type ReportQuery = z.input<typeof reportQuerySchema>;
