import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { env } from '@/env';
import type { Paginated } from '@/types/user';
import type { CreditNote } from '@/types/credit-note';

type Params = {
  page: number;
  limit: number;
  status?: CreditNote['status'];
  balanceType?: CreditNote['balanceType'];
  fromDate?: string;
  toDate?: string;
};

// `POST /creditNotes/list` returns
// `{ creditNotes, pagination: { currentPage, totalPages, total } }`.
type ListEnvelope = {
  creditNotes: (CreditNote & { dealerName?: string; dealerMobile?: string })[];
  pagination: { currentPage: number; totalPages: number; total: number };
};

export function useCreditNotes(params: Params) {
  return useQuery<Paginated<CreditNote>>({
    queryKey: ['credit-notes', 'list', params],
    queryFn: async () => {
      const envelope = await api<ListEnvelope>('creditNotes/list', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          status: params.status,
          balanceType: params.balanceType,
          // Backend reads dateFrom/dateTo, not fromDate/toDate.
          dateFrom: params.fromDate,
          dateTo: params.toDate,
        },
      });
      return {
        data: envelope.creditNotes,
        pagination: {
          currentPage: envelope.pagination.currentPage,
          totalPages: envelope.pagination.totalPages,
          totalRecords: envelope.pagination.total,
        },
      };
    },
  });
}

// NOTE: like ledgerPdfUrl, this endpoint is JWT-protected (passport + ADMIN).
// A plain <a href> click won't send the bearer token; the Angular client had
// the same gap. URL itself is correct (matches the registered GET route).
export function creditNotePdfUrl(creditNoteNumber: string) {
  return `${env.apiUrl.replace(/\/$/, '')}/creditNotes/pdf/${creditNoteNumber}`;
}

export type Dealer = {
  _id: string;
  name: string;
  mobile: string;
  dealerCode?: string;
  rewardPoints?: number;
  cash?: number;
  legacyCash?: number;
};

// `GET /users/dealers` returns `{ status: 'success', data: Dealer[] }`.
type DealersEnvelope = { status?: string; data: Dealer[] };

export function useDealers() {
  return useQuery<Dealer[]>({
    queryKey: ['credit-notes', 'dealers'],
    queryFn: async () => {
      const env = await api<DealersEnvelope>('users/dealers');
      return env.data;
    },
  });
}

export type IssueCreditNoteBody = {
  userId: string;
  balanceType: CreditNote['balanceType'];
  amount: number;
  narration?: string;
};

type IssueCreditNoteResponse = {
  creditNote: {
    creditNoteNumber: string;
    balanceType: CreditNote['balanceType'];
    amount: number;
    narration?: string;
    status: CreditNote['status'];
    createdAt: string;
  };
  balanceAfter: { rewardPoints: number; cash: number };
};

export function useIssueCreditNote() {
  const qc = useQueryClient();
  return useMutation<IssueCreditNoteResponse, Error, IssueCreditNoteBody>({
    mutationFn: (body) =>
      api<IssueCreditNoteResponse>('creditNotes/issue', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credit-notes', 'list'] });
      // The issued note also writes a ledger row + debits the dealer balance,
      // so refresh those too.
      qc.invalidateQueries({ queryKey: ['ledger', 'list'] });
      qc.invalidateQueries({ queryKey: ['credit-notes', 'dealers'] });
    },
  });
}
