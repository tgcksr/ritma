import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/feedback';
import { Input } from '@/components/ui/form';
import { useCustomers } from '@/features/customers/api';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/hooks';

export interface PickedCustomer {
  id: string;
  fullName: string;
  phone: string;
}

interface Props {
  id?: string;
  value: PickedCustomer | null;
  onChange: (customer: PickedCustomer) => void;
  invalid?: boolean;
  disabled?: boolean;
}

/** Searchable customer combobox backed by the paginated customer search endpoint. */
export function CustomerPicker({ id, value, onChange, invalid, disabled }: Props) {
  const { t } = useTranslation();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const q = useDebouncedValue(query.trim(), 200);
  const { data, isFetching } = useCustomers({ q: q || undefined, pageSize: 8 }, { enabled: open });
  const options = data?.items ?? [];

  const select = (customer: PickedCustomer) => {
    onChange({ id: customer.id, fullName: customer.fullName, phone: customer.phone });
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid}
        disabled={disabled}
        autoComplete="off"
        className="pl-9"
        placeholder={t('appointments.customerSearch')}
        value={open ? query : value ? `${value.fullName} · ${value.phone}` : ''}
        onFocus={() => {
          setOpen(true);
          setHighlight(0);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
        }}
        onKeyDown={(event) => {
          if (!open || options.length === 0) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlight((h) => Math.min(h + 1, options.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (event.key === 'Enter') {
            event.preventDefault();
            select(options[highlight]);
          }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {isFetching && options.length === 0 ? (
            <li className="flex justify-center py-3">
              <Spinner className="h-4 w-4" />
            </li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">{t('appointments.noCustomerFound')}</li>
          ) : (
            options.map((customer, index) => (
              <li
                key={customer.id}
                role="option"
                aria-selected={customer.id === value?.id}
                // mousedown fires before the input's blur, so the selection isn't lost
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(customer);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={cn('flex cursor-pointer justify-between gap-3 px-3 py-2 text-sm', index === highlight && 'bg-indigo-50')}
              >
                <span className="truncate font-medium text-slate-800">{customer.fullName}</span>
                <span className="shrink-0 text-slate-500 tabular-nums">{customer.phone}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
