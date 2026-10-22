import { useState } from 'react';
import { Clock, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ServiceDTO } from '@ritma/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';
import { useStaff } from '@/features/staff/api';
import { getErrorMessage } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { useDeleteService, useServices } from './api';
import { ServiceFormDialog } from './ServiceFormDialog';

export default function ServicesPage() {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const { data: services, isPending } = useServices();
  const { data: staff = [] } = useStaff();
  const remove = useDeleteService();

  const [editing, setEditing] = useState<ServiceDTO | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ServiceDTO | null>(null);

  const staffCount = (serviceId: string) => staff.filter((s) => s.isActive && s.serviceIds.includes(serviceId)).length;

  return (
    <>
      <PageHeader
        title={t('services.title')}
        description={t('services.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> {t('services.add')}
          </Button>
        }
      />

      {isPending ? (
        <LoadingBlock />
      ) : !services?.length ? (
        <Card>
          <EmptyState icon={Sparkles} title={t('services.empty')} description={t('services.emptyDescription')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={service.isActive ? 'p-5' : 'p-5 opacity-60'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{service.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {t('common.minutes', { count: service.durationMin })}
                    <span aria-hidden>·</span>
                    {t('services.staffCount')}: {staffCount(service.id)}
                  </p>
                </div>
                <Badge className={service.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                  {service.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-2xl font-semibold text-slate-900">{fmt.money(service.priceCents)}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(service)} aria-label={t('common.edit')}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="danger-ghost" size="icon" onClick={() => setDeleting(service)} aria-label={t('common.delete')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormDialog open={editing !== null} service={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        title={t('services.deleteTitle')}
        message={t('services.deleteMessage', { name: deleting?.name })}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          remove.mutate(deleting!.id, {
            onSuccess: () => toast.success(t('common.deleted')),
            onError: (error) => toast.error(getErrorMessage(error)),
            onSettled: () => setDeleting(null),
          })
        }
      />
    </>
  );
}
