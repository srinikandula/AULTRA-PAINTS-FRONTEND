import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated, User } from '@/types/user';

type ListParams = { page: number; limit: number; searchKey?: string; accountType?: string };

export function useUsers(params: ListParams) {
  return useQuery<Paginated<User>>({
    queryKey: ['users', 'list', params],
    queryFn: () => api<Paginated<User>>('users/all', { method: 'POST', body: params }),
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation<User, Error, { _id: string; status: 'active' | 'inactive' }>({
    mutationFn: (body) =>
      api<User>('users/toggle-status', { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'list'] }),
  });
}

export function useResetUserPassword() {
  return useMutation<{ message: string }, Error, { mobile: string }>({
    mutationFn: (body) =>
      api<{ message: string }>('users/resetPassword', { method: 'POST', body }),
  });
}
