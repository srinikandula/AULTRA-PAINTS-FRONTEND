import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { Batch } from '@/types/batch';

// Backend batch list (`POST /batchNumbers/`) returns
// `{ total, pages, currentPage, branches }` where each `branch` is a raw
// batchnumber document with PascalCase fields. Adapt at the hook boundary.
type BatchesListEnvelope = {
  total: number;
  pages: number;
  currentPage: number;
  branches: RawBatchRow[];
};

type RawBatchRow = {
  _id: string;
  BatchNumber?: string;
  Branch?: string;
  Brand?: string;
  ProductName?: string;
  BrandStr?: string;
  ProductStr?: string;
  CreationDate?: string;
  ExpiryDate?: string;
  Quantity?: number;
  startCouponSeries?: number;
  endCouponSeries?: number;
  Volume?: string;
  value?: number;
  RedeemablePoints?: number;
};

function toBatch(raw: RawBatchRow): Batch {
  return {
    _id: raw._id,
    batchNumber: raw.BatchNumber ?? '',
    product: raw.ProductStr ?? raw.ProductName,
    manufacturedDate: raw.CreationDate,
    expiryDate: raw.ExpiryDate,
    quantity: raw.Quantity,
    couponSeriesStart: raw.startCouponSeries,
    couponSeriesEnd: raw.endCouponSeries,
  };
}

type ListParams = { page?: number; limit?: number; searchKey?: string };

export function useBatches(params: ListParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  return useQuery<Batch[], Error, Batch[], readonly unknown[]>({
    queryKey: ['batches', 'list', { page, limit, searchKey: params.searchKey }],
    queryFn: async () => {
      const env = await api<BatchesListEnvelope>('batchNumbers', {
        method: 'POST',
        body: { page, limit, searchQuery: params.searchKey },
      });
      return env.branches.map(toBatch);
    },
  });
}

// Paginated variant kept for screens that want pagination metadata.
export function useBatchesPaginated(params: ListParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  return useQuery<Paginated<Batch>>({
    queryKey: ['batches', 'paginated', { page, limit, searchKey: params.searchKey }],
    queryFn: async () => {
      const env = await api<BatchesListEnvelope>('batchNumbers', {
        method: 'POST',
        body: { page, limit, searchQuery: params.searchKey },
      });
      return {
        data: env.branches.map(toBatch),
        pagination: {
          currentPage: env.currentPage,
          totalPages: env.pages,
          totalRecords: env.total,
        },
      };
    },
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation<Batch, Error, Partial<Batch>>({
    // TODO(backend): real endpoint is POST /batchNumbers/add and expects a
    // nested body `{ Branch, Brand, CreationDate, ExpiryDate, BatchNumber,
    // BatchNumbers: [{ CouponSeries, ProductName, redeemablePoints, value,
    // Volume, Quantity }, ...] }` plus coupon-availability validation. The
    // current simple Partial<Batch> form cannot produce a valid request — the
    // CreateBatch screen needs a richer form before this mutation will work.
    mutationFn: (body) => api<Batch>('batchNumbers/add', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<{ message: string }>(`batchNumbers/delete/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['batches'] }),
  });
}
