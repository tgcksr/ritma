import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import type { ReportBucket } from '@ritma/shared';
import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/cn';

/** Fixed categorical order (dataviz reference palette): slots 1-3, bottom to top. */
const SERIES = [
  { key: 'completed', color: 'var(--series-1)' },
  { key: 'active', color: 'var(--series-2)' },
  { key: 'cancelled', color: 'var(--series-3)' },
] as const;

interface Row extends ReportBucket {
  label: string;
}

interface Props {
  title: string;
  rows: Row[];
}

export function LoadChart({ title, rows }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const toggle = (
    <div className="inline-flex rounded-lg border border-slate-200 p-0.5" role="group">
      {(['chart', 'table'] as const).map((mode) => {
        const Icon = mode === 'chart' ? BarChart3 : Table2;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            aria-pressed={view === mode}
            title={t(`common.${mode}`)}
            className={cn('rounded-md p-1.5', view === mode ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700')}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{t(`common.${mode}`)}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardHeader title={title} description={t('dashboard.loadDescription')} action={toggle} />
      <div className="px-3 pt-3 pb-4 sm:px-5">
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-slate-600">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              {t(`dashboard.series.${s.key}`)}
            </li>
          ))}
        </ul>

        {view === 'chart' ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--chart-grid)' }}
                  tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={8}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'rgb(148 163 184 / 0.12)' }} content={<ChartTooltip />} />
                {SERIES.map((s, index) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="load"
                    fill={s.color}
                    stroke="var(--chart-surface)"
                    strokeWidth={2}
                    maxBarSize={36}
                    radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                    name={t(`dashboard.series.${s.key}`)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">{t('dashboard.period')}</th>
                  {SERIES.map((s) => (
                    <th key={s.key} className="px-3 py-2 text-right font-medium">
                      {t(`dashboard.series.${s.key}`)}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-medium">{t('dashboard.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className="py-1.5 pr-3 text-slate-700">{row.label}</td>
                    {SERIES.map((s) => (
                      <td key={s.key} className="px-3 py-1.5 text-right text-slate-600">
                        {row[s.key]}
                      </td>
                    ))}
                    <td className="py-1.5 pl-3 text-right font-medium text-slate-900">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, item) => sum + (item.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-slate-900">{label}</p>
      {[...payload].reverse().map((item) => (
        <p key={item.dataKey as string} className="flex items-center justify-between gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: item.color }} aria-hidden />
            {item.name}
          </span>
          <span className="font-medium text-slate-900 tabular-nums">{item.value}</span>
        </p>
      ))}
      <p className="mt-1 flex justify-between gap-4 border-t border-slate-100 pt-1 text-slate-500">
        <span>{t('dashboard.total')}</span>
        <span className="font-medium text-slate-900 tabular-nums">{total}</span>
      </p>
    </div>
  );
}
