import { useState } from 'react';
import { Mail, Pencil, Phone, Plus, Trash2, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { StaffDTO } from '@ritma/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/feedback';
import { useServices } from '@/features/services/api';
import { getErrorMessage } from '@/lib/errors';
import { useDeleteStaff, useStaff } from './api';
import { StaffFormDialog } from './StaffFormDialog';

export default function StaffPage() {
  const { t } = useTranslation();
  const { data: staff, isPending } = useStaff();
  const { data: services = [] } = useServices();
  const remove = useDeleteStaff();

  const [editing, setEditing] = useState<StaffDTO | 'new' | null>(null);
  const [deleting, setDeleting] = useState<StaffDTO | null>(null);

  const serviceName = new Map(services.map((s) => [s.id, s.name]));

  return (
    <>
      <PageHeader
        title={t('staff.title')}
        description={t('staff.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> {t('staff.add')}
          </Button>
        }
      />

      {isPending ? (
        <LoadingBlock />
      ) : !staff?.length ? (
        <Card>
          <EmptyState icon={UserCog} title={t('staff.empty')} description={t('staff.emptyDescription')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => (
            <Card key={member.id} className={member.isActive ? 'p-5' : 'p-5 opacity-60'}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                  {member.fullName
                    .split(' ')
                    .map((part) => part.charAt(0))
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold text-slate-900">{member.fullName}</h3>
                    {!member.isActive && <Badge className="bg-slate-100 text-slate-500">{t('common.inactive')}</Badge>}
                  </div>
                  <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                    {member.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {member.phone}
                      </p>
                    )}
                    {member.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5" /> {member.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {member.serviceIds.length === 0 ? (
                  <span className="text-xs text-slate-400">{t('staff.noServicesAssigned')}</span>
                ) : (
                  member.serviceIds.map((id) => (
                    <Badge key={id} className="bg-slate-100 text-slate-700">
                      {serviceName.get(id)}
                    </Badge>
                  ))
                )}
              </div>

              <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                <Button variant="ghost" size="sm" onClick={() => setEditing(member)}>
                  <Pencil className="h-4 w-4" /> {t('common.edit')}
                </Button>
                <Button variant="danger-ghost" size="sm" onClick={() => setDeleting(member)}>
                  <Trash2 className="h-4 w-4" /> {t('common.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <StaffFormDialog open={editing !== null} staff={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        title={t('staff.deleteTitle')}
        message={t('staff.deleteMessage', { name: deleting?.fullName })}
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
