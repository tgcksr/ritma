import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { serviceInputSchema, type ServiceDTO } from '@ritma/shared';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Checkbox, Field, Input } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/errors';
import { useSaveService } from './api';

const FORM_ID = 'service-form';

// The form edits a decimal price; the API stores integer minor units.
const formSchema = serviceInputSchema.omit({ priceCents: true }).extend({
  price: z
    .number({ invalid_type_error: 'validation.number' })
    .min(0, 'validation.nonNegative')
    .max(1_000_000, 'validation.tooLarge'),
});

interface Props {
  open: boolean;
  service: ServiceDTO | null;
  onClose: () => void;
}

export function ServiceFormDialog({ open, service, onClose }: Props) {
  const { t } = useTranslation();
  const save = useSaveService();
  const close = () => {
    save.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={service ? t('services.edit') : t('services.add')}
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
      <ServiceForm
        service={service}
        error={save.error}
        onSubmit={({ price, ...values }) =>
          save.mutate(
            { id: service?.id, data: { ...values, priceCents: Math.round(price * 100) } },
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

function ServiceForm({ service, error, onSubmit }: { service: ServiceDTO | null; error: unknown; onSubmit: (values: z.output<typeof formSchema>) => void }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name ?? '',
      durationMin: service?.durationMin ?? 30,
      price: service ? service.priceCents / 100 : 0,
      isActive: service?.isActive ?? true,
    },
  });

  return (
    <form id={FORM_ID} noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {!!error && <Alert>{getErrorMessage(error)}</Alert>}
      <Field label={t('services.name')} htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoFocus aria-invalid={!!errors.name} {...register('name')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('services.duration')} htmlFor="durationMin" error={errors.durationMin?.message}>
          <Input id="durationMin" type="number" min={5} step={5} inputMode="numeric" aria-invalid={!!errors.durationMin} {...register('durationMin', { valueAsNumber: true })} />
        </Field>
        <Field label={t('services.price')} htmlFor="price" error={errors.price?.message}>
          <Input id="price" type="number" min={0} step="0.01" inputMode="decimal" aria-invalid={!!errors.price} {...register('price', { valueAsNumber: true })} />
        </Field>
      </div>
      <Checkbox label={t('services.isActive')} {...register('isActive')} />
    </form>
  );
}
