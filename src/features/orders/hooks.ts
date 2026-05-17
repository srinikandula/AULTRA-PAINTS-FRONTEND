import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { Order, OrderListParams } from '@/types/order';

export function useOrders(params: OrderListParams) {
  return useQuery<Paginated<Order>>({
    queryKey: ['orders', 'list', params],
    queryFn: () => api<Paginated<Order>>('order/orders', { method: 'POST', body: params }),
  });
}

type Dealer = { _id: string; name: string; mobile: string; dealerCode?: string };
export function useDealers() {
  return useQuery<Dealer[]>({
    queryKey: ['orders', 'dealers'],
    queryFn: () => api<Dealer[]>('order/dealers', { method: 'POST', body: {} }),
  });
}
