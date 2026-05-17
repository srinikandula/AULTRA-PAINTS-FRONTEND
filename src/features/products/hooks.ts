import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { Product } from '@/types/product';

type ListParams = { page: number; limit: number; searchKey?: string };

export function useProducts(params: ListParams) {
  return useQuery<Paginated<Product>>({
    queryKey: ['products', 'list', params],
    queryFn: () => api<Paginated<Product>>('products/all', { method: 'POST', body: params }),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery<Product>({
    queryKey: ['products', 'detail', id],
    queryFn: () => api<Product>(`products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, Partial<Product>>({
    mutationFn: (body) => api<Product>('products/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, { _id: string } & Partial<Product>>({
    mutationFn: ({ _id, ...body }) =>
      api<Product>(`products/update/${_id}`, { method: 'PUT', body }),
    onSuccess: (_data, { _id }) => {
      qc.invalidateQueries({ queryKey: ['products', 'list'] });
      qc.invalidateQueries({ queryKey: ['products', 'detail', _id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`products/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
  });
}

export function useProductCatalog(params: ListParams) {
  return useQuery<Paginated<Product>>({
    queryKey: ['products', 'catalog', params],
    queryFn: () => api<Paginated<Product>>('products/catalog', { method: 'POST', body: params }),
  });
}

export function useProductDataList(params: ListParams) {
  return useQuery<Paginated<Product>>({
    queryKey: ['products', 'data-list', params],
    queryFn: () => api<Paginated<Product>>('products/data', { method: 'POST', body: params }),
  });
}
