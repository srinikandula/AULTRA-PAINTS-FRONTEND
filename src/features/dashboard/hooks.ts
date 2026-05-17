import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BatchStatsResponse } from '@/types/batch-stats';

export function useBatchStatistics() {
  return useQuery<BatchStatsResponse>({
    queryKey: ['dashboard', 'batch-statistics'],
    queryFn: () => api<BatchStatsResponse>('chart/batch-statistics'),
  });
}
