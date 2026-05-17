import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductCategory } from '@/types/product-category';

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ['product-categories', 'list'],
    queryFn: () => api<ProductCategory[]>('productCategory/all'),
  });
}
