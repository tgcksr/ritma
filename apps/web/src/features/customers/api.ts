import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerDetailDTO, CustomerDTO, CustomerInput, CustomerListItemDTO, Paginated } from '@ritma/shared';
import { api } from '@/lib/api';

export interface CustomerListParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export const customerKeys = {
  all: ['customers'] as const,
  list: (params: CustomerListParams) => [...customerKeys.all, 'list', params] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
};

export function useCustomers(params: CustomerListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => api.get<Paginated<CustomerListItemDTO>>('/customers', { ...params }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCustomer(id: string) {
  return useQuery({ queryKey: customerKeys.detail(id), queryFn: () => api.get<CustomerDetailDTO>(`/customers/${id}`) });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: CustomerInput }) =>
      id ? api.put<CustomerDTO>(`/customers/${id}`, data) : api.post<CustomerDTO>('/customers', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
