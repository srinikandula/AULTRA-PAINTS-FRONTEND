import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RewardScheme } from '@/types/reward-scheme';

type SchemeBody = Omit<RewardScheme, '_id' | 'createdAt' | 'updatedAt'>;

// Backend rewardSchemes documents only carry { rewardSchemeImageUrl,
// rewardSchemeStatus, createdAt, updatedAt }. Most UI fields (name,
// description, pointsThreshold, validFrom/validUntil) do not exist server-side
// today — they render as blanks. The list endpoint returns the array directly.
type RawScheme = {
  _id: string;
  rewardSchemeImageUrl?: string;
  rewardSchemeStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

function toScheme(raw: RawScheme): RewardScheme {
  return {
    _id: raw._id,
    name: '',
    rewardSchemeImageUrl: raw.rewardSchemeImageUrl,
    status: raw.rewardSchemeStatus === 'Active' ? 'active' : 'inactive',
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  };
}

export function useRewardSchemes() {
  return useQuery<RewardScheme[]>({
    queryKey: ['reward-schemes', 'list'],
    queryFn: async () => {
      const list = await api<RawScheme[]>('rewardSchemes/getRewardSchemes');
      return list.map(toScheme);
    },
  });
}

export function useCreateRewardScheme() {
  const qc = useQueryClient();
  return useMutation<RewardScheme, Error, SchemeBody>({
    // TODO(backend): URL is correct (POST /rewardSchemes/create) but the
    // backend's createRewardScheme expects { rewardSchemeImage (base64),
    // rewardSchemeStatus } — the simple SchemeFormDialog form (name,
    // description, pointsThreshold, validFrom/validUntil) cannot produce a
    // valid body. Form needs rework before this mutation will succeed.
    mutationFn: (body) => api<RewardScheme>('rewardSchemes/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reward-schemes', 'list'] }),
  });
}

export function useUpdateRewardScheme() {
  const qc = useQueryClient();
  return useMutation<RewardScheme, Error, { _id: string } & SchemeBody>({
    // TODO(backend): URL matches PUT /rewardSchemes/update/:id but body
    // schema diverges (see useCreateRewardScheme). Form needs rework first.
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
