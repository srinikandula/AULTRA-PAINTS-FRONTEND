import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Brand } from '@/types/brand';

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ['brands', 'list'],
    queryFn: () => api<Brand[]>('brands/all'),
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation<Brand, Error, { brandName: string; description?: string }>({
    mutationFn: (body) => api<Brand>('brands/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', 'list'] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation<Brand, Error, { _id: string; brandName: string; description?: string }>({
    mutationFn: ({ _id, ...body }) =>
      api<Brand>(`brands/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', 'list'] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`brands/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', 'list'] }),
  });
}
