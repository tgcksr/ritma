import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { staffInputSchema, type StaffDTO, type StaffInput } from '@ritma/shared';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Checkbox, Field, Input } from '@/components/ui/form';
import { useServices } from '@/features/services/api';
import { getErrorMessage } from '@/lib/errors';
import { useSaveStaff } from './api';

const FORM_ID = 'staff-form';

interface Props {
  open: boolean;
  staff: StaffDTO | null;
  onClose: () => void;
}

export function StaffFormDialog({ open, staff, onClose }: Props) {
  const { t } = useTranslation();
  const save = useSaveStaff();
  const close = () => {
    save.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={staff ? t('staff.edit') : t('staff.add')}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <StaffForm
        staff={staff}
        error={save.error}
        onSubmit={(data) =>
          save.mutate(
            { id: staff?.id, data },
            {
              onSuccess: () => {
                toast.success(t('common.saved'));
                close();
              },
            },
          )
        }
      />
    </Dialog>
  );
}

function StaffForm({ staff, error, onSubmit }: { staff: StaffDTO | null; error: unknown; onSubmit: (data: StaffInput) => void }) {
  const { t } = useTranslation();
  const { data: services = [] } = useServices();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(staffInputSchema),
    defaultValues: {
      fullName: staff?.fullName ?? '',
      phone: staff?.phone ?? '',
      email: staff?.email ?? '',
      isActive: staff?.isActive ?? true,
      serviceIds: staff?.serviceIds ?? [],
    },
  });

  return (
    <form id={FORM_ID} noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {!!error && <Alert>{getErrorMessage(error)}</Alert>}
      <Field label={t('staff.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoFocus aria-invalid={!!errors.fullName} {...register('fullName')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('staff.phone')} htmlFor="phone" optional error={errors.phone?.message}>
          <Input id="phone" type="tel" aria-invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label={t('staff.email')} htmlFor="email" optional error={errors.email?.message}>
          <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">{t('staff.services')}</legend>
        <p className="text-xs text-slate-500">{t('staff.servicesHint')}</p>
        {services.length === 0 ? (
          <p className="text-sm text-slate-500">{t('staff.noServices')}</p>
        ) : (
          <div className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
            {services.map((service) => (
              <Checkbox
                key={service.id}
                value={service.id}
                label={
                  <span className={service.isActive ? undefined : 'text-slate-400'}>
                    {service.name}
                    {!service.isActive && ` (${t('common.inactive')})`}
                  </span>
                }
                {...register('serviceIds')}
              />
            ))}
          </div>
        )}
      </fieldset>

      <Checkbox label={t('staff.isActive')} {...register('isActive')} />
    </form>
  );
}
