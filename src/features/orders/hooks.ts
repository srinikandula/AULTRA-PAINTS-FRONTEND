import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { Order, OrderListParams, OrderStatus } from '@/types/order';

// Backend list response: { success, orders, total, pages, currentPage } where
// each order has `orderId`, `finalPrice`, `dealerId` (populated user doc) and
// `createdBy` (populated user doc). Adapt at the hook boundary.
type RawOrderRow = {
  _id: string;
  orderId: string;
  status: OrderStatus;
  finalPrice?: number;
  totalPrice?: number;
  items?: Array<{
    _id?: string;
    productOfferDescription?: string;
    productPrice?: number;
    quantity?: number;
    volume?: string;
  }>;
  dealerId?: {
    _id: string;
    name?: string;
    mobile?: string;
    dealerCode?: string;
  } | string;
  createdBy?: {
    _id: string;
    name?: string;
    mobile?: string;
    dealerCode?: string;
    accountType?: string;
  } | string;
  createdAt: string;
  updatedAt: string;
};

type OrdersListEnvelope = {
  success: boolean;
  orders: RawOrderRow[];
  total: number;
  pages: number;
  currentPage: number;
};

function pickDealer(row: RawOrderRow): Order['dealer'] {
  const d = typeof row.dealerId === 'object' && row.dealerId ? row.dealerId : undefined;
  const c = typeof row.createdBy === 'object' && row.createdBy ? row.createdBy : undefined;
  const src = d ?? c;
  if (!src) return undefined;
  return {
    _id: src._id,
    name: src.name ?? '',
    mobile: src.mobile ?? '',
    dealerCode: src.dealerCode,
  };
}

function toOrder(row: RawOrderRow): Order {
  return {
    _id: row._id,
    orderNumber: row.orderId,
    dealer: pickDealer(row),
    items: (row.items ?? []).map((it) => ({
      product: {
        _id: it._id ?? '',
        productName: it.productOfferDescription ?? '',
      },
      quantity: it.quantity ?? 0,
      price: it.productPrice ?? 0,
    })),
    totalAmount: row.finalPrice ?? row.totalPrice ?? 0,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function useOrders(params: OrderListParams) {
  return useQuery<Paginated<Order>>({
    queryKey: ['orders', 'list', params],
    queryFn: async () => {
      // Backend only filters by page, limit, status, dealerCode — no date
      // range. Date filters are silently ignored server-side; we still pass
      // page/limit/status. The caller-supplied `dealerCode` (sourced from the
      // dealer dropdown) maps directly to backend's body field.
      const env = await api<OrdersListEnvelope>('order/orders', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          status: params.status,
          dealerCode: params.dealerCode,
        },
      });
      return {
        data: env.orders.map(toOrder),
        pagination: {
          currentPage: env.currentPage,
          totalPages: env.pages,
          totalRecords: env.total,
        },
      };
    },
  });
}

type Dealer = { _id: string; name: string; dealerCode?: string };

export function useDealers() {
  return useQuery<Dealer[]>({
    queryKey: ['orders', 'dealers'],
    queryFn: async () => {
      const env = await api<{ success: boolean; dealers: Dealer[] }>('order/dealers');
      return env.dealers;
    },
  });
}
