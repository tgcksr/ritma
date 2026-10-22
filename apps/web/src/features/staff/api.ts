import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StaffDTO, StaffInput } from '@ritma/shared';
import { api } from '@/lib/api';

export const staffKeys = { all: ['staff'] as const };

export function useStaff() {
  return useQuery({ queryKey: staffKeys.all, queryFn: () => api.get<StaffDTO[]>('/staff') });
}

export function useSaveStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: StaffInput }) =>
      id ? api.put<StaffDTO>(`/staff/${id}`, data) : api.post<StaffDTO>('/staff', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  });
}
