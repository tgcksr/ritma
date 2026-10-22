import { useState } from 'react';
import { BellOff, ChevronLeft, ChevronRight, Info, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';
import { getErrorMessage } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { useNotifications, useRunReminders } from './api';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [page, setPage] = useState(1);
  const { data, isPending } = useNotifications(page);
  const run = useRunReminders();

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title={t('notifications.title')}
        description={t('notifications.subtitle')}
        actions={
          <Button
            variant="secondary"
            loading={run.isPending}
            onClick={() =>
              run.mutate(undefined, {
                onSuccess: ({ sent }) =>
                  sent > 0 ? toast.success(t('notifications.runResult', { count: sent })) : toast.info(t('notifications.runNone')),
                onError: (error) => toast.error(getErrorMessage(error)),
              })
            }
          >
            {!run.isPending && <RefreshCw className="h-4 w-4" />} {t('notifications.runNow')}
          </Button>
        }
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('notifications.mockNotice')}</p>
      </div>

      <Card>
        {isPending ? (
          <LoadingBlock />
        ) : !data?.items.length ? (
          <EmptyState icon={BellOff} title={t('notifications.empty')} description={t('notifications.emptyDescription')} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((log) => {
              const Icon = log.channel === 'SMS' ? MessageSquare : Mail;
              return (
                <li key={log.id} className="flex gap-4 px-5 py-4">
                  <div className={log.channel === 'SMS' ? 'h-fit rounded-lg bg-violet-50 p-2 text-violet-600' : 'h-fit rounded-lg bg-sky-50 p-2 text-sky-600'}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link to={`/customers/${log.appointment.customer.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {log.appointment.customer.fullName}
                      </Link>
                      <Badge className="bg-slate-100 text-slate-600">{t(`notifications.channels.${log.channel}`)}</Badge>
                      <Badge className="bg-amber-50 text-amber-800">{t(`notifications.kinds.${log.kind}`)}</Badge>
                      <span className="text-xs text-slate-400 tabular-nums">{log.recipient}</span>
                    </div>
                    {log.subject && <p className="mt-1 text-sm font-medium text-slate-700">{log.subject}</p>}
                    <p className="mt-1 text-sm text-slate-600">{log.body}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {t('notifications.sentAt')}: {fmt.dateTime(log.sentAt)} · {t('notifications.appointment')}: {fmt.dateTime(log.appointment.startAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <Button variant="secondary" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t('common.previous')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="tabular-nums">{t('common.pageOf', { page, pages })}</span>
            <Button variant="secondary" size="icon" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label={t('common.next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
