export type ProductOffer = {
  _id: string;
  title: string;
  description?: string;
  productOfferImageUrl?: string;
  validFrom?: string;
  validUntil?: string;
  applicableProductIds?: string[];
  createdAt: string;
  updatedAt: string;
};
