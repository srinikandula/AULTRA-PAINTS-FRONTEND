import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RewardScheme } from '@/types/reward-scheme';

type SchemeBody = Omit<RewardScheme, '_id' | 'createdAt' | 'updatedAt'>;

export function useRewardSchemes() {
  return useQuery<RewardScheme[]>({
    queryKey: ['reward-schemes', 'list'],
    queryFn: () => api<RewardScheme[]>('rewardSchemes/all'),
  });
}

export function useCreateRewardScheme() {
  const qc = useQueryClient();
  return useMutation<RewardScheme, Error, SchemeBody>({
    mutationFn: (body) => api<RewardScheme>('rewardSchemes/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}

export function useUpdateRewardScheme() {
  const qc = useQueryClient();
  return useMutation<RewardScheme, Error, { _id: string } & SchemeBody>({
    mutationFn: ({ _id, ...body }) =>
      api<RewardScheme>(`rewardSchemes/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}

export function useDeleteRewardScheme() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`rewardSchemes/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}
