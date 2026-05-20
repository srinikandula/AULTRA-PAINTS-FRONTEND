import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Brand } from '@/types/brand';

// Backend Brand document only has `{ _id, name }`. The frontend UI keeps the
// `brandName` label (and optional `description`) for continuity — we adapt at
// the hook boundary so callers don't need to know about the backend field.
type BackendBrand = { _id: string; name: string; description?: string };

function toBrand(raw: BackendBrand): Brand {
  return { _id: raw._id, brandName: raw.name, description: raw.description ?? '' };
}

export function useBrands() {
  return useQuery<Brand[]>({
    queryKey: ['brands', 'list'],
    queryFn: async () => {
      const list = await api<BackendBrand[]>('brands/getAllBrands');
      return list.map(toBrand);
    },
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation<Brand, Error, { brandName: string; description?: string }>({
    mutationFn: async ({ brandName, description }) => {
      const raw = await api<BackendBrand>('brands', {
        method: 'POST',
        body: { name: brandName, description: description ?? '' },
      });
      return toBrand(raw);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', 'list'] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation<Brand, Error, { _id: string; brandName: string; description?: string }>({
    mutationFn: async ({ _id, brandName, description }) => {
      const raw = await api<BackendBrand>(`brands/${_id}`, {
        method: 'PUT',
        body: { name: brandName, description: description ?? '' },
      });
      return toBrand(raw);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', 'list'] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`brands/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', 'list'] }),
  });
}
