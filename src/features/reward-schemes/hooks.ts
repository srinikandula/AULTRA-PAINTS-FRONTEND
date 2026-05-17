import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RewardScheme } from '@/types/reward-scheme';

type CreateBody = {
  rewardSchemeStatus: 'Active' | 'Inactive';
  rewardSchemeImage: string; // base64 data URI
};

type UpdateBody = {
  _id: string;
  rewardSchemeStatus: 'Active' | 'Inactive';
  rewardSchemeImage?: string; // base64 data URI, optional on update
};

export function useRewardSchemes() {
  return useQuery<RewardScheme[]>({
    queryKey: ['reward-schemes', 'list'],
    queryFn: () => api<RewardScheme[]>('rewardSchemes/getRewardSchemes'),
  });
}

export function useCreateRewardScheme() {
  const qc = useQueryClient();
  return useMutation<RewardScheme, Error, CreateBody>({
    mutationFn: (body) =>
      api<RewardScheme>('rewardSchemes/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}

export function useUpdateRewardScheme() {
  const qc = useQueryClient();
  return useMutation<RewardScheme, Error, UpdateBody>({
    mutationFn: ({ _id, ...body }) =>
      api<RewardScheme>(`rewardSchemes/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}

export function useDeleteRewardScheme() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<{ message: string }>(`rewardSchemes/delete/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}
