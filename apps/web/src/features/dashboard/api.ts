import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReportSummaryDTO } from '@ritma/shared';
import { api } from '@/lib/api';

export type DashboardRange = 'today' | 'week' | 'month';

/** Local-time boundaries for the selected range (weeks start on Monday). */
export function rangeBounds(range: DashboardRange, now = new Date()) {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);

  if (range === 'today') {
    to.setDate(from.getDate() + 1);
  } else if (range === 'week') {
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    to.setTime(from.getTime());
    to.setDate(from.getDate() + 7);
  } else {
    from.setDate(1);
    to.setTime(from.getTime());
    to.setMonth(from.getMonth() + 1);
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export function useReportSummary(range: DashboardRange) {
  const bounds = rangeBounds(range);
  const tzOffset = new Date().getTimezoneOffset();
  return useQuery({
    queryKey: ['reports', 'summary', bounds, tzOffset],
    queryFn: () => api.get<ReportSummaryDTO>('/reports/summary', { ...bounds, tzOffset }),
    placeholderData: keepPreviousData,
  });
}
