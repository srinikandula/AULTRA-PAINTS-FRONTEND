import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { ProductOffer } from '@/types/product-offer';

type ListParams = { page: number; limit: number; searchKey?: string };

// Backend paginated-list response shape (flat) used by /searchProductOffers.
type ListEnvelope<T> = {
  status?: number;
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
};

function toPaginated<T>(envelope: ListEnvelope<T>): Paginated<T> {
  return {
    data: envelope.data,
    pagination: {
      currentPage: envelope.currentPage,
      totalPages: envelope.pages,
      totalRecords: envelope.total,
    },
  };
}

type CreateBody = {
  productOfferDescription: string;
  validUntil?: string;
  productOfferStatus: 'Active' | 'Inactive';
  cashback: number;
  redeemPoints: number;
  productCategory: string | null;
  price: Array<{ refId: string; price: number }>;
  productOfferImage: string; // base64 data URI
};

type UpdateBody = {
  _id: string;
  productOfferDescription: string;
  validUntil?: string;
  productOfferStatus: 'Active' | 'Inactive';
  cashback: number;
  redeemPoints: number;
  productCategory: string | null;
  price: Array<{ refId: string; price: number }>;
  productOfferImage?: string; // optional on update
};

export function useProductOffers(params: ListParams) {
  return useQuery<Paginated<ProductOffer>>({
    queryKey: ['product-offers', 'list', params],
    queryFn: async () => {
      const env = await api<ListEnvelope<ProductOffer>>(
        'productOffers/searchProductOffers',
        {
          method: 'POST',
          body: {
            page: params.page,
            limit: params.limit,
            searchKey: params.searchKey,
          },
        },
      );
      return toPaginated(env);
    },
  });
}

export function useCreateProductOffer() {
  const qc = useQueryClient();
  return useMutation<ProductOffer, Error, CreateBody>({
    mutationFn: (body) =>
      api<ProductOffer>('productOffers/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}

export function useUpdateProductOffer() {
  const qc = useQueryClient();
  return useMutation<ProductOffer, Error, UpdateBody>({
    mutationFn: ({ _id, ...body }) =>
      api<ProductOffer>(`productOffers/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}

export function useDeleteProductOffer() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<{ message: string }>(`productOffers/delete/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}
