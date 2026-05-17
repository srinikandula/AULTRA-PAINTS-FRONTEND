export type CouponTransaction = {
  _id: string;
  couponCode: number;
  UDID: string;
  redeemablePoints?: number;
  value?: number;
  pointsRedeemedBy?: string;
  pointsRedeemedAt?: string;
  cashRedeemedBy?: string;
  cashRedeemedAt?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
};
