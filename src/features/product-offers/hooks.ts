import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductOffer } from '@/types/product-offer';

type OfferBody = Omit<ProductOffer, '_id' | 'createdAt' | 'updatedAt'>;

export function useProductOffers() {
  return useQuery<ProductOffer[]>({
    queryKey: ['product-offers', 'list'],
    queryFn: () => api<ProductOffer[]>('productOffers/all'),
  });
}

export function useCreateProductOffer() {
  const qc = useQueryClient();
  return useMutation<ProductOffer, Error, OfferBody>({
    mutationFn: (body) => api<ProductOffer>('productOffers/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}

export function useUpdateProductOffer() {
  const qc = useQueryClient();
  return useMutation<ProductOffer, Error, { _id: string } & OfferBody>({
    mutationFn: ({ _id, ...body }) =>
      api<ProductOffer>(`productOffers/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}

export function useDeleteProductOffer() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`productOffers/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}
