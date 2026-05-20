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

// `POST /transaction` returns the flat envelope
// `{ total, pages, currentPage, transactionsData }`.
type TransactionsEnvelope = {
  total: number;
  pages: number;
  currentPage: number;
  transactionsData: CouponTransaction[];
};

export function useTransactions(params: Params) {
  return useQuery<Paginated<CouponTransaction>>({
    queryKey: ['transactions', 'list', params],
    queryFn: async () => {
      const envelope = await api<TransactionsEnvelope>('transaction', {
        method: 'POST',
        body: params,
      });
      return {
        data: envelope.transactionsData,
        pagination: {
          currentPage: envelope.currentPage,
          totalPages: envelope.pages,
          totalRecords: envelope.total,
        },
      };
    },
  });
}

type LedgerParams = {
  page: number;
  limit: number;
  creditNoteStatus?: 'pending' | 'issued';
  couponCode?: string;
  date?: string;
};

// `POST /transactionLedger/getTransactions` returns
// `{ transactions, pagination: { currentPage, totalPages, totalTransactions } }`.
type LedgerEnvelope = {
  transactions: LedgerRow[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
  };
};

export function useLedger(params: LedgerParams) {
  return useQuery<Paginated<LedgerRow>>({
    queryKey: ['ledger', 'list', params],
    queryFn: async () => {
      const envelope = await api<LedgerEnvelope>(
        'transactionLedger/getTransactions',
        { method: 'POST', body: params },
      );
      return {
        data: envelope.transactions,
        pagination: {
          currentPage: envelope.pagination.currentPage,
          totalPages: envelope.pagination.totalPages,
          totalRecords: envelope.pagination.totalTransactions,
        },
      };
    },
  });
}

// NOTE: the credit-note PDF endpoint is JWT-protected (passport.authenticate).
// Opening it in a plain <a> tag will not send the Authorization header — the
// same gap existed in the Angular client. The URL itself is now correct
// (matches `router.get('/credit-note/:transactionLedgerId', ...)`); follow-up
// is required to fetch the PDF via the api() helper and serve it as a
// downloadable Blob.
export function ledgerPdfUrl(rowId: string) {
  return `${env.apiUrl.replace(/\/$/, '')}/transactionLedger/credit-note/${rowId}`;
}
