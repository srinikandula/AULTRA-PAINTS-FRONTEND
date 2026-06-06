import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { env } from '@/env';
import type { Paginated, User } from '@/types/user';

async function downloadExport(
  path: string,
  options: { method?: string; body?: unknown; filename: string },
) {
  const token = useAuthStore.getState().token;
  const base = env.apiUrl.endsWith('/') ? env.apiUrl : env.apiUrl + '/';
  const url = new URL(path.replace(/^\//, ''), base).toString();
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = options.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

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

function invalidateUserLists(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['users', 'list'] });
  qc.invalidateQueries({ queryKey: ['users', 'unverified'] });
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

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation<User, Error, Partial<User>>({
    mutationFn: (body) =>
      api<User>('users/add', { method: 'POST', body }),
    onSuccess: () => invalidateUserLists(qc),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation<User, Error, { _id: string } & Partial<Omit<User, '_id'>>>({
    mutationFn: ({ _id, ...body }) =>
      api<User>(`users/${_id}`, { method: 'PUT', body }),
    onSuccess: () => invalidateUserLists(qc),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<{ message: string }>(`users/${_id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateUserLists(qc),
  });
}

export type SalesExecutive = { id: string; name: string; mobile: string };

export function useSalesExecutives() {
  return useQuery<SalesExecutive[]>({
    queryKey: ['users', 'sales-executives'],
    queryFn: async () => {
      const env = await api<{ data: SalesExecutive[] }>('users/sales-executives');
      return env.data;
    },
  });
}

// Canonical route list from Focus (`Core__salesman`). Each route carries the
// actual salesman's name + mobile so picking a route can also set the dealer's
// `salesExecutive` consistently.
export type Route = {
  routeName: string;
  salesmanName: string;
  salesExecutiveMobile: string | null;
};

export function useRoutes() {
  return useQuery<Route[]>({
    queryKey: ['users', 'routes'],
    queryFn: async () => {
      const env = await api<{ data: Route[] }>('users/routes');
      return env.data;
    },
    staleTime: 10 * 60 * 1000, // routes change rarely; match the backend cache
  });
}

export function useExportUsers() {
  return useMutation<void, Error, { searchQuery?: string; accountType?: string }>({
    mutationFn: ({ searchQuery, accountType } = {}) =>
      downloadExport('users/export', {
        method: 'POST',
        body: { searchQuery, accountType },
        filename: `Users_${new Date().toLocaleDateString().replaceAll('/', '-')}.csv`,
      }),
  });
}

export function useExportUnverifiedUsers() {
  return useMutation<void, Error, void>({
    mutationFn: () =>
      downloadExport('users/export-unverified', {
        filename: `Unverified_Users_${new Date().toLocaleDateString().replaceAll('/', '-')}.csv`,
      }),
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
