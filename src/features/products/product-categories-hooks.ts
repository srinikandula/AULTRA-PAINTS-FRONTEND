import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductCategory } from '@/types/product-category';

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ['product-categories', 'list'],
    queryFn: () => api<ProductCategory[]>('productCategory/all'),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<ProductCategory, Error, { categoryName: string; description?: string }>({
    mutationFn: (body) => api<ProductCategory>('productCategory/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories', 'list'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation<ProductCategory, Error, { _id: string; categoryName: string; description?: string }>({
    mutationFn: ({ _id, ...body }) =>
      api<ProductCategory>(`productCategory/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories', 'list'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`productCategory/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories', 'list'] }),
  });
}
