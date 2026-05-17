import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { CouponTransaction } from '@/types/transaction';

type Params = {
  page: number;
  limit: number;
  searchKey?: string;
  pointsRedeemedBy?: string;
  cashRedeemedBy?: string;
  couponCode?: string;
  showUsedCoupons?: boolean;
  salesExecutiveMobile?: string;
};

export function useTransactions(params: Params) {
  return useQuery<Paginated<CouponTransaction>>({
    queryKey: ['transactions', 'list', params],
    queryFn: () => api<Paginated<CouponTransaction>>('transaction', { method: 'POST', body: params }),
  });
}
