import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated, User } from '@/types/user';

type ListParams = { page: number; limit: number; searchKey?: string; accountType?: string };

// Backend paginated-list response shape (flat — different from our internal
// `Paginated<T>`). Both `users/searchUser` and `users/unverified-users` use it.
type ListEnvelope<T> = {
  status?: number;
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
};

function toPaginated<T>(envelope: ListEnvelope<T>): Paginated<T> {
  return {
    data: envelope.data,
    pagination: {
      currentPage: envelope.currentPage,
      totalPages: envelope.pages,
      totalRecords: envelope.total,
    },
  };
}

export function useUsers(params: ListParams) {
  return useQuery<Paginated<User>>({
    queryKey: ['users', 'list', params],
    queryFn: async () => {
      const env = await api<ListEnvelope<User>>('users/searchUser', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          searchQuery: params.searchKey,
          accountType: params.accountType,
        },
      });
      return toPaginated(env);
    },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation<User, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<User>(`users/toggle-status/${_id}`, { method: 'PUT' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'list'] }),
  });
}

export function useResetUserPassword() {
  return useMutation<{ message: string }, Error, { mobile: string }>({
    mutationFn: (body) =>
      api<{ message: string }>('users/resetPassword', { method: 'POST', body }),
  });
}

export function useUnverifiedUsers(params: { page: number; limit: number; searchKey?: string }) {
  return useQuery<Paginated<User>>({
    queryKey: ['users', 'unverified', params],
    queryFn: async () => {
      const env = await api<ListEnvelope<User>>('users/unverified-users', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          searchQuery: params.searchKey,
        },
      });
      return toPaginated(env);
    },
  });
}

export function useVerifyUser() {
  const qc = useQueryClient();
  return useMutation<User, Error, { _id: string }>({
    mutationFn: (body) => api<User>('users/verify', { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'unverified'] });
      qc.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}
