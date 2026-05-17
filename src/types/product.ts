export type Product = {
  _id: string;
  productName: string;
  productCode: string;
  brand?: { _id: string; brandName: string } | string;
  category?: { _id: string; categoryName: string } | string;
  redeemPoints?: number;
  cashback?: number;
  price?: number;
  productImage?: string;
  description?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};
