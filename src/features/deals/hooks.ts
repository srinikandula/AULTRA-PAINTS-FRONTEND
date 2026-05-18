import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { Deal, DealInput } from '@/types/deal';

type ListParams = {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
  category?: string;
};

type ListEnvelope<T> = {
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
};

function toPaginated<T>(env: ListEnvelope<T>): Paginated<T> {
  return {
    data: env.data,
    pagination: {
      currentPage: env.currentPage,
      totalPages: env.pages,
      totalRecords: env.total,
    },
  };
}

function buildQueryString(params: ListParams): string {
  const usp = new URLSearchParams();
  usp.set('page', String(params.page));
  usp.set('limit', String(params.limit));
  if (params.search) usp.set('search', params.search);
  if (params.active !== undefined) usp.set('active', String(params.active));
  if (params.category) usp.set('category', params.category);
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export function useDeals(params: ListParams) {
  return useQuery<Paginated<Deal>>({
    queryKey: ['deals', 'list', params],
    queryFn: async () => {
      const env = await api<ListEnvelope<Deal>>(`deals${buildQueryString(params)}`, {
        method: 'GET',
      });
      return toPaginated(env);
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation<Deal, Error, DealInput>({
    mutationFn: (body) => api<Deal>('deals', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals', 'list'] }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation<Deal, Error, { _id: string } & Partial<DealInput>>({
    mutationFn: ({ _id, ...body }) =>
      api<Deal>(`deals/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals', 'list'] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<{ message: string }>(`deals/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals', 'list'] }),
  });
}
