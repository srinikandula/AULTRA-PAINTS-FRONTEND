import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductOffer } from '@/types/product-offer';

type OfferBody = Omit<ProductOffer, '_id' | 'createdAt' | 'updatedAt'>;

// Backend productOffers list: POST /productOffers/searchProductOffers returns
// `{ data, total, pages, currentPage }`. The mongoose document keys the
// description on `productOfferDescription`; there is no separate `title` /
// `validFrom` field, so we map title <- productOfferDescription.
type RawOffer = {
  _id: string;
  productOfferDescription?: string;
  productOfferImageUrl?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
};

type SearchEnvelope<T> = {
  status?: number;
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
};

function toProductOffer(raw: RawOffer): ProductOffer {
  return {
    _id: raw._id,
    title: raw.productOfferDescription ?? '',
    productOfferImageUrl: raw.productOfferImageUrl,
    validUntil: raw.validUntil,
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  };
}

export function useProductOffers() {
  return useQuery<ProductOffer[]>({
    queryKey: ['product-offers', 'list'],
    queryFn: async () => {
      const env = await api<SearchEnvelope<RawOffer>>('productOffers/searchProductOffers', {
        method: 'POST',
        body: { page: 1, limit: 100 },
      });
      return env.data.map(toProductOffer);
    },
  });
}

export function useCreateProductOffer() {
  const qc = useQueryClient();
  return useMutation<ProductOffer, Error, OfferBody>({
    // TODO(backend): URL is correct but the backend's createProductOffer
    // expects a multipart-style body with productDescription, productStatus,
    // price (object of volume->[{refId:price}]), productImage (base64),
    // focusProductId, focusProductMapping, etc. The current simple form
    // (title/description/validFrom/validUntil) cannot produce that body. The
    // OfferFormDialog needs to be rebuilt before this mutation will succeed.
    mutationFn: (body) => api<ProductOffer>('productOffers/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-offers', 'list'] }),
  });
}

export function useUpdateProductOffer() {
  const qc = useQueryClient();
  return useMutation<ProductOffer, Error, { _id: string } & OfferBody>({
    // TODO(backend): URL matches PUT /productOffers/update/:id but the body
    // schema diverges (see useCreateProductOffer). Form needs rework first.
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
