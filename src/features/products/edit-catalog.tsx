import { useLocation, useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogForm } from './catalog-form';
import { useProductCatalog } from './hooks';
import type { CatalogItem } from './hooks';

export function EditCatalog() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromState =
    (location.state as { catalog?: CatalogItem } | null)?.catalog ?? undefined;

  const fallback = useProductCatalog({ page: 1, limit: 1000 });
  const item = fromState ?? fallback.data?.data.find((x) => x._id === id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product catalog</h1>
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
