import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationLogDTO, Paginated } from '@ritma/shared';
import { api } from '@/lib/api';

export const notificationKeys = { all: ['notifications'] as const };

export function useNotifications(page: number) {
  return useQuery({
    queryKey: [...notificationKeys.all, page],
    queryFn: () => api.get<Paginated<NotificationLogDTO>>('/notifications', { page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });
}

export function useRunReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ sent: number }>('/notifications/run'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
