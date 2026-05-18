export type ProductOffer = {
  _id: string;
  productOfferDescription: string;
  productOfferImageUrl?: string;
  productOfferStatus: 'Active' | 'Inactive';
  cashback: number;
  redeemPoints: number;
  validUntil?: string;
  productCategory?: { _id: string; name: string } | string | null;
  price?: Array<{ refId: string; price: number }>;
  createdAt?: string;
  updatedAt?: string;
};
