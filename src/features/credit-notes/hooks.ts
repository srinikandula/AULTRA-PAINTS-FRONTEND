import { useQuery } from '@tanstack/react-query';
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
