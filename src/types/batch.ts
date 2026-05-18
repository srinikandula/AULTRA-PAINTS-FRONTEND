// UI Batch shape. The backend batchnumber doc has PascalCase fields
// (`BatchNumber`, `CreationDate`, `ExpiryDate`, `startCouponSeries`, etc.); the
// hooks layer adapts them to this camelCase shape. The mongoose model has no
// timestamps and no explicit status flag — keep those optional.
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
};
