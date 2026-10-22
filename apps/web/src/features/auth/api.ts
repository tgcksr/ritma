import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, UserDTO } from '@ritma/shared';
import { api, ApiError } from '@/lib/api';

export const sessionKey = ['auth', 'session'] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      try {
        return (await api.get<{ user: UserDTO }>('/auth/me')).user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<{ user: UserDTO }>('/auth/login', input),
    onSuccess: ({ user }) => queryClient.setQueryData(sessionKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(sessionKey, null);
    },
  });
}
