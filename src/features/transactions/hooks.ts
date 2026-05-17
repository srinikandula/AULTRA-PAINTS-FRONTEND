import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { CouponTransaction } from '@/types/transaction';
import type { LedgerRow } from '@/types/ledger';
import { env } from '@/env';

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

type LedgerParams = { page: number; limit: number; transactionType?: 'points' | 'cash'; couponCode?: string; date?: string };

export function useLedger(params: LedgerParams) {
  return useQuery<Paginated<LedgerRow>>({
    queryKey: ['ledger', 'list', params],
    queryFn: () => api<Paginated<LedgerRow>>('transactionLedger/getTransactions', { method: 'POST', body: params }),
  });
}

export function ledgerPdfUrl(rowId: string) {
  return `${env.apiUrl.replace(/\/$/, '')}/transactionLedger/pdf/${rowId}`;
}
