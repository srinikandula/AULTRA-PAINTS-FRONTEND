import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Batch } from '@/types/batch';

export function useBatches() {
  return useQuery<Batch[]>({
    queryKey: ['batches', 'list'],
    queryFn: () => api<Batch[]>('batchNumbers/all'),
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation<Batch, Error, Partial<Batch>>({
    mutationFn: (body) => api<Batch>('batchNumbers/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches', 'list'] }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`batchNumbers/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches', 'list'] }),
  });
}
