import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { Paginated } from '@/types/user';
import type { CouponTransaction } from '@/types/transaction';
import type { LedgerRow } from '@/types/ledger';
import { env } from '@/env';

export type ExportTransactionsParams = {
  searchKey?: string;
  showUsedCoupons?: boolean;
};

export async function exportTransactions(params: ExportTransactionsParams): Promise<void> {
  const token = useAuthStore.getState().token;
  const base = env.apiUrl.endsWith('/') ? env.apiUrl : env.apiUrl + '/';
  const url = new URL('transaction/export', base).toString();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`Export failed (${res.status})`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `Transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

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

// Fetch the JWT-protected credit-note PDF with the Authorization header and
// trigger a browser download. A downloaded file can be opened and reloaded
// freely, unlike a blob: URL which is ephemeral and tied to the creating tab.
export async function openLedgerPdf(rowId: string): Promise<void> {
  const { useAuthStore } = await import('@/stores/auth-store');
  const token = useAuthStore.getState().token;
  const url = `${env.apiUrl.replace(/\/$/, '')}/transactionLedger/credit-note/${rowId}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = `CreditNote-${rowId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
