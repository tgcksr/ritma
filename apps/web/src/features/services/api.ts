import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ServiceDTO, ServiceInput } from '@ritma/shared';
import { api } from '@/lib/api';

export const serviceKeys = { all: ['services'] as const };

export function useServices() {
  return useQuery({ queryKey: serviceKeys.all, queryFn: () => api.get<ServiceDTO[]>('/services') });
}

export function useSaveService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ServiceInput }) =>
      id ? api.put<ServiceDTO>(`/services/${id}`, data) : api.post<ServiceDTO>('/services', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}
