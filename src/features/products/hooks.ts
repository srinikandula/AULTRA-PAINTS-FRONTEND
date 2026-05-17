import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/types/user';
import type { Product } from '@/types/product';

type ListParams = { page: number; limit: number; searchKey?: string };

// Backend `/products` list returns a flat envelope keyed on `products` + a
// `pagination` block with `totalProducts`. Each item is `{ _id, brandId,
// BrandNameStr, products }`. The catalog (`productCatlog/search`) returns a
// classic flat envelope `{ data, total, pages, currentPage }` with rich items.

type ProductsListEnvelope = {
  products: Array<{
    _id: string;
    brandId: string;
    BrandNameStr?: string;
    products: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
  };
};

type CatalogEnvelope<T> = {
  status?: number;
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
};

// Catalog (productCatlog) items as the backend stores them.
type RawCatalogItem = {
  _id: string;
  productOfferDescription?: string;
  productOfferStatus?: string;
  productOfferImageUrl?: string;
  productCategory?: { _id: string; name: string } | string | null;
  productPrice?: number;
  productPrices?: Array<{ volume?: string; price: number }>;
  brandId?: string;
  BrandNameStr?: string;
};

function toProductFromBrandRow(raw: ProductsListEnvelope['products'][number]): Product {
  return {
    _id: raw._id,
    productCode: '',
    productName: raw.products,
    brand: raw.BrandNameStr ?? raw.brandId,
  };
}

function toProductFromCatalog(raw: RawCatalogItem): Product {
  const category =
    raw.productCategory && typeof raw.productCategory === 'object'
      ? { _id: raw.productCategory._id, categoryName: raw.productCategory.name }
      : (raw.productCategory ?? undefined);
  return {
    _id: raw._id,
    productCode: '',
    productName: raw.productOfferDescription ?? '',
    productImage: raw.productOfferImageUrl,
    brand: raw.BrandNameStr ?? raw.brandId,
    category,
    price: raw.productPrice,
    status: raw.productOfferStatus === 'Active' ? 'active' : 'inactive',
  };
}

export function useProducts(params: ListParams) {
  return useQuery<Paginated<Product>>({
    queryKey: ['products', 'list', params],
    queryFn: async () => {
      const search = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      });
      const env = await api<ProductsListEnvelope>(`products?${search.toString()}`);
      return {
        data: env.products.map(toProductFromBrandRow),
        pagination: {
          currentPage: env.pagination.currentPage,
          totalPages: env.pagination.totalPages,
          totalRecords: env.pagination.totalProducts,
        },
      };
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery<Product>({
    queryKey: ['products', 'detail', id],
    // TODO(backend): no `GET /products/:productId` single-product endpoint;
    // `GET /products/:brandId` returns the products for a brand. The edit flow
    // currently has no working detail call — leaving the hook in place so the
    // form skeleton renders, but the request will 404 / return an unrelated
    // shape until a real endpoint is registered.
    queryFn: () => api<Product>(`products/${id}`),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, Partial<Product> & { brand?: string | { _id: string } }>({
    mutationFn: (body) => {
      const brandId = typeof body.brand === 'string' ? body.brand : body.brand?._id;
      return api<Product>('products', {
        method: 'POST',
        body: { brandId, products: body.productName },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<Product, Error, { _id: string } & Partial<Product> & { brand?: string | { _id: string } }>({
    mutationFn: ({ _id, ...body }) => {
      const brandId = typeof body.brand === 'string' ? body.brand : body.brand?._id;
      return api<Product>(`products/${_id}`, {
        method: 'PUT',
        body: { brandId, products: body.productName },
      });
    },
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
    queryFn: async () => {
      const env = await api<CatalogEnvelope<RawCatalogItem>>('productCatlog/search', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          searchQuery: params.searchKey,
        },
      });
      return {
        data: env.data.map(toProductFromCatalog),
        pagination: {
          currentPage: env.currentPage,
          totalPages: env.pages,
          totalRecords: env.total,
        },
      };
    },
  });
}

// Batch statistics list — used by the /product-data-list route. The Angular
// screen calls this "Batch Statistics", not "Product Data List", but we keep
// the React route name for URL parity with the Angular app.

export type BatchStatRow = {
  name: string; // formatted "Product-Brand-Branch-BatchNumber"
  branch: string;
  createdAt: string;
  issuedPoints: number;
  issuedCash: number;
  redeemedPoints: number;
  redeemedCash: number;
};

type BatchStatsEnvelope = {
  success: boolean;
  data: BatchStatRow[];
  branches: string[]; // sorted list of all distinct branches (for the filter UI)
  pagination: { total: number; page: number; totalPages: number; limit: number };
};

export type BatchStatsResult = {
  data: BatchStatRow[];
  branches: string[];
  pagination: { currentPage: number; totalPages: number; totalRecords: number };
};

export function useBatchStatisticsList(params: { page: number; limit: number; branches: string[] }) {
  return useQuery<BatchStatsResult>({
    queryKey: ['products', 'batch-statistics-list', params],
    queryFn: async () => {
      const env = await api<BatchStatsEnvelope>('chart/batch-statistics-list', {
        method: 'POST',
        body: { page: params.page, limit: params.limit, branches: params.branches },
      });
      return {
        data: env.data,
        branches: env.branches,
        pagination: {
          currentPage: env.pagination.page,
          totalPages: env.pagination.totalPages,
          totalRecords: env.pagination.total,
        },
      };
    },
  });
}
