// UI-facing Product. The backend has two unrelated product surfaces today:
//   - `/products` (mongoose `Product`): `{ _id, brandId, products }` — just
//     a name string per brand. Most rich fields (price, redeemPoints, etc.)
//     do not exist on this collection.
//   - `/productCatlog` (mongoose `productOfferModel`): rich catalog with
//     image, price array, etc.
// Both feed UI tables that share this shape, so most fields are optional.
export type Product = {
  _id: string;
  productName: string;
  productCode?: string;
  brand?: { _id: string; brandName: string } | string;
  category?: { _id: string; categoryName: string } | string;
  redeemPoints?: number;
  cashback?: number;
  price?: number;
  productImage?: string;
  description?: string;
  status?: 'active' | 'inactive';
};
