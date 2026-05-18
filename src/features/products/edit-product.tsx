import { useLocation, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogForm } from './catalog-form';
import { useProductCatalog } from './hooks';
import type { CatalogItem } from './hooks';

// The catalog has no single-item-by-id endpoint, so Edit reads the item from
// React Router state when the user clicks the catalog card's edit button.
// Direct URL navigation (or hard refresh) falls back to fetching the catalog
// list and finding by id -- crude, but adequate for v1.

export function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromState =
    (location.state as { catalog?: CatalogItem } | null)?.catalog ?? undefined;

  // Skip the fallback list fetch when state already provided the item.
  const fallback = useProductCatalog({ page: 1, limit: 1000 });
  const item =
    fromState ?? fallback.data?.data.find((x) => x._id === id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      {!fromState && fallback.isError && (
        <p className="text-sm text-destructive">
          Couldn't load: {fallback.error.message}
        </p>
      )}
      {!fromState && fallback.isLoading ? (
        <Skeleton className="h-[480px] w-full max-w-3xl" />
      ) : !item ? (
        <p className="text-sm text-muted-foreground">Product not found.</p>
      ) : (
        <CatalogForm initial={item} />
      )}
    </div>
  );
}
