export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

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
  dealerId?: string;
  fromDate?: string;
  toDate?: string;
};
