import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { customerInputSchema, type CustomerDTO, type CustomerInput } from '@ritma/shared';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, Input, Textarea } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/errors';
import { useSaveCustomer } from './api';

const FORM_ID = 'customer-form';

interface Props {
  open: boolean;
  customer: CustomerDTO | null;
  onClose: () => void;
  onSaved?: (customer: CustomerDTO) => void;
}

export function CustomerFormDialog({ open, customer, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const save = useSaveCustomer();
  const close = () => {
    save.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={customer ? t('customers.edit') : t('customers.add')}
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
      <CustomerForm
        customer={customer}
        error={save.error}
        onSubmit={(data) =>
          save.mutate(
            { id: customer?.id, data },
            {
              onSuccess: (saved) => {
                toast.success(t('common.saved'));
                onSaved?.(saved);
                close();
              },
            },
          )
        }
      />
    </Dialog>
  );
}

function CustomerForm({ customer, error, onSubmit }: { customer: CustomerDTO | null; error: unknown; onSubmit: (data: CustomerInput) => void }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(customerInputSchema),
    defaultValues: {
      fullName: customer?.fullName ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      notes: customer?.notes ?? '',
    },
  });

  return (
    <form id={FORM_ID} noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {!!error && <Alert>{getErrorMessage(error)}</Alert>}
      <Field label={t('customers.fullName')} htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoFocus autoComplete="off" aria-invalid={!!errors.fullName} {...register('fullName')} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('customers.phone')} htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" placeholder="05xx xxx xx xx" aria-invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label={t('customers.email')} htmlFor="email" optional error={errors.email?.message}>
          <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
      </div>
      <Field label={t('customers.notes')} htmlFor="notes" optional error={errors.notes?.message}>
        <Textarea id="notes" rows={4} placeholder={t('customers.notesPlaceholder')} {...register('notes')} />
      </Field>
    </form>
  );
}
