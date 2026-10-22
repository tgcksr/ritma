import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { AppointmentDTO, AppointmentInput, AppointmentListQuery, AppointmentStatus } from '@ritma/shared';
import { api } from '@/lib/api';

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (query: AppointmentListQuery) => [...appointmentKeys.all, 'list', query] as const,
};

/** Appointment changes ripple into customer history, dashboard numbers and reminders. */
function invalidateAppointmentData(queryClient: QueryClient) {
  for (const key of [['appointments'], ['customers'], ['reports'], ['notifications']]) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export function useAppointments(query: AppointmentListQuery | null) {
  return useQuery({
    queryKey: appointmentKeys.list(query ?? { from: '', to: '' }),
    queryFn: () => api.get<AppointmentDTO[]>('/appointments', { ...query }),
    enabled: !!query,
    placeholderData: keepPreviousData,
  });
}

export function useSaveAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AppointmentInput }) =>
      id ? api.put<AppointmentDTO>(`/appointments/${id}`, data) : api.post<AppointmentDTO>('/appointments', data),
    onSettled: () => invalidateAppointmentData(queryClient),
  });
}

export function useChangeAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch<AppointmentDTO>(`/appointments/${id}/status`, { status }),
    onSettled: () => invalidateAppointmentData(queryClient),
  });
}
