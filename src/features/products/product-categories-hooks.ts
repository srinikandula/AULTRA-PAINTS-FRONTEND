import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductCategory } from '@/types/product-category';

// Backend `ProductCategory` is `{ _id, name }` (mounted at /productCategories).
// We adapt at the hook boundary so the UI keeps using `categoryName`.
type BackendCategory = { _id: string; name: string };

function toCategory(raw: BackendCategory): ProductCategory {
  return { _id: raw._id, categoryName: raw.name };
}

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ['product-categories', 'list'],
    queryFn: async () => {
      const env = await api<{ data: BackendCategory[] }>('productCategories/all');
      return env.data.map(toCategory);
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<ProductCategory, Error, { categoryName: string; description?: string }>({
    mutationFn: async ({ categoryName }) => {
      const env = await api<{ data: BackendCategory; message?: string }>('productCategories', {
        method: 'POST',
        body: { name: categoryName },
      });
      return toCategory(env.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories', 'list'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation<ProductCategory, Error, { _id: string; categoryName: string; description?: string }>({
    mutationFn: async ({ _id, categoryName }) => {
      const env = await api<{ data: BackendCategory; message?: string }>(`productCategories/${_id}`, {
        method: 'PUT',
        body: { name: categoryName },
      });
      return toCategory(env.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories', 'list'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`productCategories/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product-categories', 'list'] }),
  });
}
