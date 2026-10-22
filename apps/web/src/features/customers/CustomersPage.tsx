import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { CustomerListItemDTO } from '@ritma/shared';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, LoadingBlock, Spinner } from '@/components/ui/feedback';
import { Input } from '@/components/ui/form';
import { getErrorMessage } from '@/lib/errors';
import { useFormatters } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { useCustomers, useDeleteCustomer } from './api';
import { CustomerFormDialog } from './CustomerFormDialog';

const PAGE_SIZE = 15;

export default function CustomersPage() {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search.trim(), 300);
  const { data, isPending, isFetching } = useCustomers({ q: q || undefined, page, pageSize: PAGE_SIZE });
  const remove = useDeleteCustomer();

  const [editing, setEditing] = useState<CustomerListItemDTO | 'new' | null>(null);
  const [deleting, setDeleting] = useState<CustomerListItemDTO | null>(null);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title={t('customers.title')}
        description={t('customers.subtitle')}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> {t('customers.add')}
          </Button>
        }
      />

      <Card>
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t('customers.searchPlaceholder')}
              className="pl-9"
              aria-label={t('customers.searchPlaceholder')}
            />
          </div>
          {isFetching && !isPending && <Spinner className="h-4 w-4" />}
        </div>

        {isPending ? (
          <LoadingBlock />
        ) : !data?.items.length ? (
          q ? (
            <EmptyState icon={Search} title={t('customers.noMatch')} />
          ) : (
            <EmptyState
              icon={Users}
              title={t('customers.empty')}
              description={t('customers.emptyDescription')}
              action={
                <Button onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" /> {t('customers.add')}
                </Button>
              }
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">{t('customers.fullName')}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t('customers.phone')}</th>
                  <th className="hidden px-4 py-3 lg:table-cell">{t('customers.email')}</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">{t('customers.appointments')}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t('customers.lastVisit')}</th>
                  <th className="px-4 py-3 text-right">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {customer.fullName}
                      </Link>
                      <p className="text-xs text-slate-500 md:hidden">{customer.phone}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 tabular-nums md:table-cell">{customer.phone}</td>
                    <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{customer.email ?? t('common.none')}</td>
                    <td className="hidden px-4 py-3 text-right text-slate-600 tabular-nums sm:table-cell">{customer.appointmentCount}</td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {customer.lastAppointmentAt ? fmt.date(customer.lastAppointmentAt) : t('common.none')}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => setEditing(customer)} aria-label={t('common.edit')}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="danger-ghost" size="icon" onClick={() => setDeleting(customer)} aria-label={t('common.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{t('common.totalRecords', { count: data.total })}</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t('common.previous')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular-nums">{t('common.pageOf', { page, pages })}</span>
              <Button variant="secondary" size="icon" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label={t('common.next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CustomerFormDialog open={editing !== null} customer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        title={t('customers.deleteTitle')}
        message={t('customers.deleteMessage', { name: deleting?.fullName })}
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
