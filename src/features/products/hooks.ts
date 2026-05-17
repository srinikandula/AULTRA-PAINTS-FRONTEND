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

// Rich catalog item shape — exposed for the catalog card grid and the
// Create / Edit Product screens. Mirrors the backend `productOfferModel`
// document plus the per-request `productPrice` / `productPrices` fields
// the `searchProductCatlog` controller appends after Focus8 + dealer
// pricing resolution.
export type CatalogItem = {
  _id: string;
  productOfferDescription: string;
  productOfferStatus: 'Active' | 'Inactive';
  productOfferImageUrl?: string;
  productCategory?: { _id: string; name: string } | string | null;
  productPrice?: number;
  productPrices?: Array<{ volume?: string; price: number }>;
  // Stored shape on the document — `{ volume, refId, price }` rows.
  price?: Array<{ volume: string; refId: string; price: number }>;
  focusProductId?: string | number;
  focusUnitId?: number;
  focusProductMapping?: Array<{
    volume: string;
    focusProductId: number;
    focusUnitId?: number;
  }>;
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

// The /products mongoose collection (a flat "name string per brand" surface)
// does not have a single-item-by-id endpoint, and the Catalog rewrite now
// owns the rich Create / Edit flow via /productCatlog. We dropped the dead
// useProduct / useCreateProduct / useUpdateProduct hooks (which targeted
// /products and never worked end-to-end). useProducts + useDeleteProduct
// stay because product-list.tsx still renders the brand-products table.

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) => api<{ message: string }>(`products/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'list'] }),
  });
}

export function useProductCatalog(params: ListParams) {
  return useQuery<Paginated<CatalogItem>>({
    queryKey: ['products', 'catalog', params],
    queryFn: async () => {
      const env = await api<CatalogEnvelope<CatalogItem>>('productCatlog/search', {
        method: 'POST',
        body: {
          page: params.page,
          limit: params.limit,
          searchQuery: params.searchKey,
        },
      });
      return {
        data: env.data,
        pagination: {
          currentPage: env.currentPage,
          totalPages: env.pages,
          totalRecords: env.total,
        },
      };
    },
  });
}

// Catalog create / update mutations target the `/productCatlog/create` and
// `/productCatlog/update/:id` endpoints. The backend's price field is a
// JSON-stringified `{ [volume]: Array<{ [refId]: price }> }` object — v1
// hard-codes refId="All" for every entry; geo-pricing (state/zone/district
// places) is a v2 feature. `productImage` is a base64 data URI; on update
// it's only sent when the user picks a new file.
type CatalogMutationBody = {
  productDescription: string;
  productStatus: 'Active' | 'Inactive';
  productCategory: string | null;
  focusProductId: string;
  focusUnitId: number;
  focusProductMapping: string | null; // JSON-stringified array, or null
  price: string;                       // JSON-stringified object
  productImage?: string;               // base64 data URI; create-required
};

export function useCreateCatalog() {
  const qc = useQueryClient();
  return useMutation<CatalogItem, Error, CatalogMutationBody>({
    mutationFn: (body) =>
      api<CatalogItem>('productCatlog/create', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'catalog'] }),
  });
}

export function useUpdateCatalog() {
  const qc = useQueryClient();
  return useMutation<CatalogItem, Error, { _id: string } & CatalogMutationBody>({
    mutationFn: ({ _id, ...body }) =>
      api<CatalogItem>(`productCatlog/update/${_id}`, { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'catalog'] }),
  });
}

export function useDeleteCatalog() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { _id: string }>({
    mutationFn: ({ _id }) =>
      api<{ message: string }>(`productCatlog/delete/${_id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', 'catalog'] }),
  });
}

// Focus8 product master, surfaced by the backend at GET /products/focus-products.
// Each row preserves Focus' raw column names — `iMasterId` is the numeric
// product id, `sName` is the display name. We keep the quirky shape rather
// than renaming, so the field is recognizable when debugging against Focus8.
export type FocusProduct = {
  iMasterId: number | string;
  sName: string;
  sCode?: string;
};

export function useFocusProducts() {
  return useQuery<FocusProduct[]>({
    queryKey: ['products', 'focus-products'],
    queryFn: async () => {
      const env = await api<{ success: boolean; data: FocusProduct[] }>(
        'products/focus-products',
      );
      return env.data ?? [];
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
