import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, ExternalLink } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  addMinutes,
  allowedTransitions,
  isEditableStatus,
  isTerminalStatus,
  type AppointmentDTO,
  type AppointmentInput,
  type AppointmentStatus,
} from '@ritma/shared';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { useServices } from '@/features/services/api';
import { useStaff } from '@/features/staff/api';
import { ApiError } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { fromDateTimeInputs, toDateInput, toTimeInput, useFormatters } from '@/lib/format';
import { useChangeAppointmentStatus, useSaveAppointment } from './api';
import { CustomerPicker, type PickedCustomer } from './CustomerPicker';
import { StatusBadge } from './StatusBadge';

const FORM_ID = 'appointment-form';

const formSchema = z.object({
  customer: z.custom<PickedCustomer | null>().refine((value) => !!value, 'validation.required'),
  serviceId: z.string().min(1, 'validation.required'),
  staffId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.datetime'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'validation.datetime'),
  notes: z.string().max(1000, 'validation.tooLong'),
});

const STATUS_BUTTON: Record<AppointmentStatus, 'primary' | 'secondary' | 'danger-ghost'> = {
  PENDING: 'secondary',
  CONFIRMED: 'primary',
  COMPLETED: 'primary',
  CANCELLED: 'danger-ghost',
};

/** Next half hour from now, used as the default slot. */
function nextHalfHour() {
  const date = new Date();
  date.setMinutes(date.getMinutes() < 30 ? 30 : 60, 0, 0);
  return date;
}

interface Props {
  open: boolean;
  appointment: AppointmentDTO | null;
  defaultStart?: Date;
  defaultCustomer?: PickedCustomer;
  onClose: () => void;
}

export function AppointmentFormDialog({ open, appointment, defaultStart, defaultCustomer, onClose }: Props) {
  const { t } = useTranslation();
  const save = useSaveAppointment();
  const changeStatus = useChangeAppointmentStatus();
  const [confirmStatus, setConfirmStatus] = useState<AppointmentStatus | null>(null);

  const editable = !appointment || isEditableStatus(appointment.status);

  const close = () => {
    save.reset();
    changeStatus.reset();
    onClose();
  };

  const applyStatus = (status: AppointmentStatus) =>
    changeStatus.mutate(
      { id: appointment!.id, status },
      {
        onSuccess: () => {
          toast.success(t('appointments.statusChanged'));
          setConfirmStatus(null);
          close();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error));
          setConfirmStatus(null);
        },
      },
    );

  return (
    <>
      <Dialog
        open={open}
        onClose={close}
        size="lg"
        title={appointment ? t('appointments.detail') : t('appointments.new')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {editable ? t('common.cancel') : t('common.close')}
            </Button>
            {editable && (
              <Button type="submit" form={FORM_ID} loading={save.isPending}>
                {t('common.save')}
              </Button>
            )}
          </>
        }
      >
        {appointment && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status={appointment.status} className="text-sm" />
              <Link
                to={`/customers/${appointment.customerId}`}
                onClick={close}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
              >
                {t('appointments.goToCustomer')} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            {allowedTransitions(appointment.status).length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('appointments.changeStatus')}>
                {allowedTransitions(appointment.status).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={STATUS_BUTTON[status]}
                    loading={changeStatus.isPending && changeStatus.variables?.status === status}
                    onClick={() => (isTerminalStatus(status) ? setConfirmStatus(status) : applyStatus(status))}
                  >
                    {t(`statusAction.${status}`)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        <AppointmentForm
          key={appointment?.id ?? 'new'}
          appointment={appointment}
          defaultStart={defaultStart}
          defaultCustomer={defaultCustomer}
          editable={editable}
          error={save.error}
          onSubmit={(data) =>
            save.mutate(
              { id: appointment?.id, data },
              {
                onSuccess: () => {
                  toast.success(appointment ? t('appointments.updated') : t('appointments.created'));
                  close();
                },
              },
            )
          }
        />
      </Dialog>

      <ConfirmDialog
        open={!!confirmStatus}
        title={t('appointments.terminalTitle')}
        message={confirmStatus && t('appointments.terminalMessage', { status: t(`status.${confirmStatus}`) })}
        confirmLabel={confirmStatus && t(`statusAction.${confirmStatus}`)}
        tone={confirmStatus === 'CANCELLED' ? 'danger' : 'primary'}
        loading={changeStatus.isPending}
        onClose={() => setConfirmStatus(null)}
        onConfirm={() => applyStatus(confirmStatus!)}
      />
    </>
  );
}

interface FormProps {
  appointment: AppointmentDTO | null;
  defaultStart?: Date;
  defaultCustomer?: PickedCustomer;
  editable: boolean;
  error: unknown;
  onSubmit: (data: AppointmentInput) => void;
}

function AppointmentForm({ appointment, defaultStart, defaultCustomer, editable, error, onSubmit }: FormProps) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const servicesQuery = useServices();
  const staffQuery = useStaff();

  const start = appointment ? new Date(appointment.startAt) : (defaultStart ?? nextHalfHour());
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: appointment?.customer ?? defaultCustomer ?? null,
      serviceId: appointment?.serviceId ?? '',
      staffId: appointment?.staffId ?? '',
      date: toDateInput(start),
      time: toTimeInput(start),
      notes: appointment?.notes ?? '',
    },
  });

  const [serviceId, staffId, date, time] = watch(['serviceId', 'staffId', 'date', 'time']);

  // Inactive services/staff stay selectable only if this appointment already uses them.
  const services = (servicesQuery.data ?? []).filter((s) => s.isActive || s.id === appointment?.serviceId);
  const service = services.find((s) => s.id === serviceId);
  const staffOptions = (staffQuery.data ?? []).filter(
    (s) => s.serviceIds.includes(serviceId) && (s.isActive || s.id === appointment?.staffId),
  );

  // Clear the staff choice when it no longer fits the selected service.
  useEffect(() => {
    if (staffQuery.isSuccess && staffId && !staffOptions.some((s) => s.id === staffId)) setValue('staffId', '');
  }, [serviceId, staffId, staffQuery.isSuccess, staffOptions, setValue]);

  const startAt = date && time ? fromDateTimeInputs(date, time) : null;
  const validStart = startAt && !Number.isNaN(startAt.getTime()) ? startAt : null;

  const conflict =
    error instanceof ApiError && (error.code === 'STAFF_BUSY' || error.code === 'CUSTOMER_BUSY')
      ? (error.details as { conflictWith?: { startAt: string; endAt: string } } | undefined)?.conflictWith
      : undefined;

  const submit = handleSubmit((values) =>
    onSubmit({
      customerId: values.customer.id,
      serviceId: values.serviceId,
      staffId: values.staffId || null,
      startAt: fromDateTimeInputs(values.date, values.time).toISOString(),
      notes: values.notes.trim() || null,
    }),
  );

  return (
    <form id={FORM_ID} noValidate onSubmit={submit} className="space-y-4">
      {!editable && <Alert className="border-slate-200 bg-slate-50 text-slate-600">{t('appointments.notEditable')}</Alert>}
      {!!error && (
        <Alert>
          {getErrorMessage(error)}
          {conflict && <p className="mt-0.5 text-xs">{t('appointments.conflictAt', { range: fmt.timeRange(conflict.startAt, conflict.endAt) })}</p>}
        </Alert>
      )}

      <fieldset disabled={!editable} className="space-y-4">
        <Field label={t('appointments.customer')} htmlFor="customer" error={errors.customer?.message}>
          <Controller
            control={control}
            name="customer"
            render={({ field }) => (
              <CustomerPicker id="customer" value={field.value} onChange={field.onChange} invalid={!!errors.customer} disabled={!editable} />
            )}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('appointments.service')} htmlFor="serviceId" error={errors.serviceId?.message}>
            <Select id="serviceId" aria-invalid={!!errors.serviceId} {...register('serviceId')}>
              <option value="">{t('appointments.selectService')}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {t('common.minutes', { count: s.durationMin })} · {fmt.money(s.priceCents)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t('appointments.staff')}
            htmlFor="staffId"
            optional
            hint={serviceId && staffQuery.isSuccess && staffOptions.length === 0 ? t('appointments.noStaffForService') : undefined}
          >
            <Select id="staffId" disabled={!serviceId} {...register('staffId')}>
              <option value="">{t('appointments.anyStaff')}</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('appointments.date')} htmlFor="date" error={errors.date?.message}>
            <Input id="date" type="date" aria-invalid={!!errors.date} {...register('date')} />
          </Field>
          <Field label={t('appointments.time')} htmlFor="time" error={errors.time?.message}>
            <Input id="time" type="time" step={300} aria-invalid={!!errors.time} {...register('time')} />
          </Field>
        </div>

        {service && validStart && (
          <p className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {fmt.dateLong(validStart)} ·{' '}
              {t('appointments.summary', {
                start: fmt.time(validStart),
                end: fmt.time(addMinutes(validStart, service.durationMin)),
                duration: service.durationMin,
                price: fmt.money(appointment && appointment.serviceId === service.id ? appointment.priceCents : service.priceCents),
              })}
            </span>
          </p>
        )}

        <Field label={t('appointments.notes')} htmlFor="notes" optional error={errors.notes?.message}>
          <Textarea id="notes" rows={2} {...register('notes')} />
        </Field>
      </fieldset>
    </form>
  );
}
