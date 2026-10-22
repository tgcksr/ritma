import { useMemo, useState, type ComponentType } from 'react';
import { CalendarCheck, CalendarDays, CircleDollarSign, Hourglass, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ReportSummaryDTO } from '@ritma/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/card';
import { Alert, EmptyState, LoadingBlock, Spinner } from '@/components/ui/feedback';
import { StatusBadge } from '@/features/appointments/StatusBadge';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { useReportSummary, type DashboardRange } from './api';
import { LoadChart } from './LoadChart';

const RANGES: DashboardRange[] = ['today', 'week', 'month'];
const DEFAULT_OPEN_HOUR = 8;
const DEFAULT_CLOSE_HOUR = 20;

export default function DashboardPage() {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [range, setRange] = useState<DashboardRange>('week');
  const { data, isPending, isFetching, error } = useReportSummary(range);

  const chartRows = useMemo(() => (data ? buildChartRows(data, range, fmt.dayShort) : []), [data, range, fmt]);

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={
          <>
            {isFetching && !isPending && <Spinner className="h-4 w-4" />}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm" role="group">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    range === r ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  {t(`dashboard.range.${r}`)}
                </button>
              ))}
            </div>
          </>
        }
      />

      {isPending ? (
        <LoadingBlock />
      ) : error || !data ? (
        <Alert>{getErrorMessage(error)}</Alert>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={CalendarDays}
              label={t('dashboard.totalAppointments')}
              value={fmt.number(data.totals.all)}
              hint={t('dashboard.activeCount', { count: data.totals.PENDING + data.totals.CONFIRMED })}
            />
            <StatTile
              icon={CalendarCheck}
              label={t('dashboard.completed')}
              value={fmt.number(data.totals.COMPLETED)}
              hint={t('dashboard.completionRate', { rate: completionRate(data) })}
            />
            <StatTile icon={CircleDollarSign} label={t('dashboard.realizedRevenue')} value={fmt.money(data.revenue.realizedCents)} />
            <StatTile icon={Hourglass} label={t('dashboard.expectedRevenue')} value={fmt.money(data.revenue.expectedCents)} hint={t('dashboard.expectedHint')} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <LoadChart title={range === 'today' ? t('dashboard.loadTitleHourly') : t('dashboard.loadTitleDaily')} rows={chartRows} />
            </div>
            <ServiceBreakdown data={data} />
          </div>

          <UpcomingList data={data} />
        </div>
      )}
    </>
  );
}

function completionRate({ totals }: ReportSummaryDTO) {
  const decided = totals.COMPLETED + totals.CANCELLED;
  return decided === 0 ? 0 : Math.round((totals.COMPLETED / decided) * 100);
}

/** Days for week/month; business hours (widened to fit any outliers) for today. */
function buildChartRows(data: ReportSummaryDTO, range: DashboardRange, dayLabel: (d: Date) => string) {
  if (range !== 'today') {
    return data.daily.map((bucket) => ({ ...bucket, label: dayLabel(new Date(`${bucket.key}T00:00:00`)) }));
  }
  const busy = data.hourly.filter((b) => b.total > 0).map((b) => Number(b.key));
  const first = Math.min(DEFAULT_OPEN_HOUR, ...busy);
  const last = Math.max(DEFAULT_CLOSE_HOUR, ...busy);
  return data.hourly.slice(first, last + 1).map((bucket) => ({ ...bucket, label: `${bucket.key}:00` }));
}

function StatTile({ icon: Icon, label, value, hint }: { icon: ComponentType<{ className?: string }>; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="rounded-lg bg-indigo-50 p-2">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function ServiceBreakdown({ data }: { data: ReportSummaryDTO }) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const max = Math.max(1, ...data.byService.map((s) => s.count));

  return (
    <Card>
      <CardHeader title={t('dashboard.byService')} description={t('dashboard.byServiceDescription')} />
      {data.byService.length === 0 ? (
        <EmptyState icon={Inbox} title={t('dashboard.noData')} />
      ) : (
        <ul className="space-y-4 px-5 py-4">
          {data.byService.map((service) => (
            <li key={service.serviceId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-slate-800">{service.name}</span>
                <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                  {service.count} · {fmt.moneyShort(service.revenueCents)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${(service.count / max) * 100}%`, background: 'var(--series-1)' }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function UpcomingList({ data }: { data: ReportSummaryDTO }) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  return (
    <Card>
      <CardHeader
        title={t('dashboard.upcoming')}
        action={
          <Link to="/calendar" className="text-sm font-medium text-indigo-600 hover:underline">
            {t('common.viewAll')}
          </Link>
        }
      />
      {data.upcoming.length === 0 ? (
        <EmptyState icon={CalendarDays} title={t('dashboard.noUpcoming')} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.upcoming.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
              <div className="w-36 shrink-0">
                <p className="text-sm font-medium text-slate-900">{fmt.dayShort(a.startAt)}</p>
                <p className="text-xs text-slate-500 tabular-nums">{fmt.timeRange(a.startAt, a.endAt)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/customers/${a.customerId}`} className="truncate text-sm font-medium text-slate-800 hover:text-indigo-600">
                  {a.customer.fullName}
                </Link>
                <p className="truncate text-xs text-slate-500">
                  {a.service.name}
                  {a.staff && ` · ${a.staff.fullName}`}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
