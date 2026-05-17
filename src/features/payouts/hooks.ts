import { useQuery } from '@tanstack/react-query';
import { api, type ApiError } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { PayoutTransaction } from '@/types/payout';

export function usePayouts(params: { page: number; limit: number }) {
  return useQuery<Paginated<PayoutTransaction>, ApiError>({
    queryKey: ['payouts', 'list', params],
    queryFn: () => api<Paginated<PayoutTransaction>>(
      `cashFree/getTransactions?page=${params.page}&limit=${params.limit}`,
    ),
    retry: false,
  });
}

export function useBulkPeBalance() {
  return useQuery<{ availableBalance: number }, ApiError>({
    queryKey: ['payouts', 'bulkpe-balance'],
    queryFn: () => api<{ availableBalance: number }>('cashFree/fetchBulkPeBalance'),
    retry: false,
  });
}
