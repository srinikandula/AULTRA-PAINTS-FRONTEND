export type Batch = {
  _id: string;
  batchNumber: string;
  product?: { _id: string; productName: string } | string;
  manufacturedDate?: string;
  expiryDate?: string;
  quantity?: number;
  couponSeriesStart?: number;
  couponSeriesEnd?: number;
  status?: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
};
