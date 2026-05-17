// Order statuses recognized by the backend's getOrders endpoint.
export type OrderStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DISPATCHED'
  | 'IN-PARCEL';

export type Order = {
  _id: string;
  orderNumber: string;
  dealer?: { _id: string; name: string; mobile: string; dealerCode?: string };
  items: Array<{ product: { _id: string; productName: string }; quantity: number; price: number }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrderListParams = {
  page: number;
  limit: number;
  status?: OrderStatus;
  // Backend filters dealers by code (looked up server-side via User.dealerCode).
  dealerCode?: string;
  // Kept for source compatibility with the UI; not sent to backend (no
  // date-range support today).
  fromDate?: string;
  toDate?: string;
};
