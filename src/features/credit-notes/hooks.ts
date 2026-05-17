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

export function useCreditNotes(params: Params) {
  return useQuery<Paginated<CreditNote>>({
    queryKey: ['credit-notes', 'list', params],
    queryFn: () => api<Paginated<CreditNote>>('creditNotes/list', { method: 'POST', body: params }),
  });
}

export function creditNotePdfUrl(creditNoteNumber: string) {
  return `${env.apiUrl.replace(/\/$/, '')}/creditNotes/pdf/${creditNoteNumber}`;
}
