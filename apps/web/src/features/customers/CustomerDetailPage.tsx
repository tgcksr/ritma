import { useState } from 'react';
import { ArrowLeft, CalendarPlus, Mail, Pencil, Phone, StickyNote, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { AppointmentDTO } from '@ritma/shared';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, EmptyState, LoadingBlock } from '@/components/ui/feedback';
import { AppointmentFormDialog } from '@/features/appointments/AppointmentFormDialog';
import { StatusBadge } from '@/features/appointments/StatusBadge';
import { getErrorMessage } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { useCustomer, useDeleteCustomer } from './api';
import { CustomerFormDialog } from './CustomerFormDialog';

export default function CustomerDetailPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const fmt = useFormatters();
  const navigate = useNavigate();
  const { data: customer, isPending, error } = useCustomer(id);
  const remove = useDeleteCustomer();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDTO | 'new' | null>(null);

  if (isPending) return <LoadingBlock />;
  if (error || !customer) return <Alert>{getErrorMessage(error)}</Alert>;

  const stats = [
    { label: t('customers.detail.total'), value: fmt.number(customer.stats.total) },
    { label: t('customers.detail.completed'), value: fmt.number(customer.stats.completed) },
    { label: t('customers.detail.upcoming'), value: fmt.number(customer.stats.upcoming) },
    { label: t('customers.detail.spent'), value: fmt.money(customer.stats.totalSpentCents) },
  ];

  return (
    <>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {t('customers.detail.back')}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-700">
            {customer.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{customer.fullName}</h1>
            <p className="text-sm text-slate-500">{t('customers.detail.since', { date: fmt.date(customer.createdAt) })}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setAppointment('new')}>
            <CalendarPlus className="h-4 w-4" /> {t('customers.detail.newAppointment')}
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> {t('common.edit')}
          </Button>
          <Button variant="danger-ghost" onClick={() => setDeleting(true)}>
            <Trash2 className="h-4 w-4" /> {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="px-4 py-3">
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title={t('customers.detail.contact')} />
            <dl className="space-y-3 px-5 py-4 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${customer.phone}`} className="text-slate-700 hover:text-indigo-600">
                  {customer.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="truncate text-slate-700 hover:text-indigo-600">
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-slate-400">{t('common.none')}</span>
                )}
              </div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t('customers.notes')} />
            <div className="flex gap-3 px-5 py-4 text-sm">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="whitespace-pre-wrap text-slate-700">{customer.notes || <span className="text-slate-400">{t('customers.detail.noNotes')}</span>}</p>
            </div>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader title={t('customers.detail.history')} />
          {customer.appointments.length === 0 ? (
            <EmptyState icon={CalendarPlus} title={t('customers.detail.noHistory')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {customer.appointments.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setAppointment(a)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="w-28 shrink-0">
                      <p className="text-sm font-medium text-slate-900">{fmt.date(a.startAt)}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{fmt.timeRange(a.startAt, a.endAt)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-800">{a.service.name}</p>
                      <p className="truncate text-xs text-slate-500">{a.staff?.fullName ?? t('appointments.anyStaff')}</p>
                    </div>
                    <span className="text-sm text-slate-600 tabular-nums">{fmt.money(a.priceCents)}</span>
                    <StatusBadge status={a.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <CustomerFormDialog open={editing} customer={customer} onClose={() => setEditing(false)} />

      <AppointmentFormDialog
        open={appointment !== null}
        appointment={appointment === 'new' ? null : appointment}
        defaultCustomer={customer}
        onClose={() => setAppointment(null)}
      />

      <ConfirmDialog
        open={deleting}
        title={t('customers.deleteTitle')}
        message={t('customers.deleteMessage', { name: customer.fullName })}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
        onClose={() => setDeleting(false)}
        onConfirm={() =>
          remove.mutate(customer.id, {
            onSuccess: () => {
              toast.success(t('common.deleted'));
              navigate('/customers', { replace: true });
            },
            onError: (err) => {
              toast.error(getErrorMessage(err));
              setDeleting(false);
            },
          })
        }
      />
    </>
  );
}
