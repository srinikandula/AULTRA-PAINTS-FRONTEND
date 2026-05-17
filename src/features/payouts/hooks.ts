import { useQuery } from '@tanstack/react-query';
import { api, type ApiError } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { PayoutTransaction } from '@/types/payout';

// Cash redemption (Cashfree + BulkPe) was retired backend-side. Both
// `/cashFree/*` and `/bulkPe/*` mounts now respond 410 Gone with
// `{ success:false, code:'CASH_REDEMPTION_DISABLED', message }`. The Payouts
// screen surfaces this as a retired-feature notice. URLs below match the real
// (disabled) mount paths so any future re-activation works without renaming.

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
    queryFn: () => api<{ availableBalance: number }>('bulkPe/fetchBulkPeBalance'),
    retry: false,
  });
}
