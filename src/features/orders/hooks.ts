import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type {
  FocusSyncStatus,
  Order,
  OrderItem,
  OrderListParams,
  OrderStatus,
} from '@/types/order';

// Backend list response: { success, orders, total, pages, currentPage } where
// each order has `orderId`, `finalPrice`, `dealerId` (populated user doc) and
// `createdBy` (populated user doc). Adapt at the hook boundary.
type RawOrderRow = {
  _id: string;
  orderId: string;
  status: OrderStatus;
  finalPrice?: number;
  totalPrice?: number;
  gstPrice?: number;
  items?: Array<{
    _id?: string;
    productOfferDescription?: string;
    productPrice?: number;
    quantity?: number;
    volume?: string;
  }>;
  dealerId?:
    | {
        _id: string;
        name?: string;
        mobile?: string;
        dealerCode?: string;
      }
    | string;
  createdBy?:
    | {
        _id: string;
        name?: string;
        mobile?: string;
        dealerCode?: string;
        accountType?: string;
      }
    | string;
  branchId?: number;
  branchName?: string;
  narration?: string;
  focusSyncStatus?: FocusSyncStatus;
  focusOrderId?: string | number;
  focusDCInvoiceId?: string[];
  statusHistory?: Array<{
    status: string;
    changedAt: string;
    changedBy?: { name?: string; accountType?: string } | null;
    remarks?: string;
  }>;
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

function pickCreatedBy(row: RawOrderRow): Order['createdBy'] {
  const c = typeof row.createdBy === 'object' && row.createdBy ? row.createdBy : undefined;
  if (!c) return undefined;
  return {
    _id: c._id,
    name: c.name ?? '',
    mobile: c.mobile,
    accountType: c.accountType,
    dealerCode: c.dealerCode,
  };
}

function toItem(it: NonNullable<RawOrderRow['items']>[number]): OrderItem {
  const qty = it.quantity ?? 0;
  const price = it.productPrice ?? 0;
  return {
    product: {
      _id: it._id ?? '',
      productName: it.productOfferDescription ?? '',
      productOfferDescription: it.productOfferDescription,
    },
    productName: it.productOfferDescription,
    productOfferDescription: it.productOfferDescription,
    volume: it.volume,
    quantity: qty,
    price,
    productPrice: price,
    subTotal: qty * price,
  };
}

function normalizeDealerId(row: RawOrderRow): Order['dealerId'] {
  if (!row.dealerId) return undefined;
  if (typeof row.dealerId === 'string') return row.dealerId;
  return {
    _id: row.dealerId._id,
    name: row.dealerId.name ?? '',
    dealerCode: row.dealerId.dealerCode,
    mobile: row.dealerId.mobile,
  };
}

function toOrder(row: RawOrderRow): Order {
  return {
    _id: row._id,
    orderId: row.orderId,
    // Back-compat: existing readers use `orderNumber`.
    orderNumber: row.orderId,
    dealerId: normalizeDealerId(row),
    createdBy: pickCreatedBy(row),
    dealer: pickDealer(row),
    items: (row.items ?? []).map(toItem),
    totalPrice: row.totalPrice,
    gstPrice: row.gstPrice,
    finalPrice: row.finalPrice,
    // Aliases for the detail panel.
    subTotal: row.totalPrice,
    gst: row.gstPrice,
    totalAmount: row.finalPrice ?? row.totalPrice ?? 0,
    status: row.status,
    branchId: row.branchId,
    branchName: row.branchName,
    narration: row.narration,
    focusSyncStatus: row.focusSyncStatus,
    focusOrderId: row.focusOrderId,
    focusDCInvoiceId: row.focusDCInvoiceId,
    dcInvoiceIds: row.focusDCInvoiceId,
    statusHistory: row.statusHistory?.map((h) => ({
      ...h,
      changedBy: h.changedBy ?? undefined,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function useOrders(params: OrderListParams) {
  return useQuery<Paginated<Order>>({
    queryKey: ['orders', 'list', params],
    queryFn: async () => {
      // Backend filters by page/limit/status/dealerCode. `salesExecutiveMobile`
      // is included in the body for forward-compat but is currently ignored
      // server-side (see TODO on OrderListParams).
      const env = await api<OrdersListEnvelope>('order/orders', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          status: params.status,
          dealerCode: params.dealerCode,
          salesExecutiveMobile: params.salesExecutiveMobile,
          ...(params.branchId !== undefined && { branchId: params.branchId }),
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

// Order details envelope returned by GET /order/details/:orderId.
type OrderDetailsEnvelope = {
  success: boolean;
  order: RawOrderRow & {
    focusSyncResponse?: unknown;
    focusData?: unknown;
  };
};

export function useOrderDetails(orderId: string | undefined) {
  return useQuery<Order>({
    queryKey: ['orders', 'detail', orderId],
    queryFn: async () => {
      // Backend wraps the result in `{ success, order }`. Unwrap and pass
      // through the same row -> Order adapter the list uses so the detail
      // panel reads from a single shape.
      const env = await api<OrderDetailsEnvelope>(`order/details/${orderId}`);
      return toOrder(env.order);
    },
    enabled: !!orderId,
  });
}

export function useRetryFocusSync() {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message?: string },
    Error,
    { orderId: string }
  >({
    mutationFn: ({ orderId }) =>
      api<{ success: boolean; message?: string }>('order/retryFocusSync', {
        method: 'POST',
        body: { orderId },
      }),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
      qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

// TODO: replace the dealer Select with a Combobox typeahead — the live list
//   is ~3500 dealers. Same future-work as the Credit Notes Issue dialog.
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

export type SalesExecutive = { id: string; name: string; mobile: string };

export function useSalesExecutives() {
  return useQuery<SalesExecutive[]>({
    queryKey: ['orders', 'sales-executives'],
    queryFn: async () => {
      const env = await api<{ status: string; data: SalesExecutive[] }>(
        'users/sales-executives',
      );
      return env.data ?? [];
    },
  });
}

export type FocusBranch = { iMasterId: number; sName: string };

export function useFocusBranches() {
  return useQuery<FocusBranch[]>({
    queryKey: ['focus', 'branches'],
    queryFn: async () => {
      const env = await api<{ success: boolean; branches: FocusBranch[] }>(
        'products/focus-branches',
      );
      return env.branches ?? [];
    },
  });
}

export function useUpdateOrderStatusManual() {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message?: string },
    Error,
    { orderId: string; status: 'DISPATCHED' | 'MANUALLY_DISPATCHED'; remarks?: string }
  >({
    mutationFn: (body) =>
      api<{ success: boolean; message?: string }>('order/updateOrderStatusManual', {
        method: 'PUT',
        body,
      }),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
      qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}
