import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/stores/auth-store';
import { useProductCatalog, useUpdateCatalog, useDeleteCatalog } from './hooks';
import type { CatalogItem } from './hooks';

// TODO: cart + checkout for Dealers (Add-to-Cart modal with volume button group,
//   Cart sidebar with qty controls, Focus Entity/Warehouse/Branch + narration,
//   Proceed to Checkout -> POST /order/create). Punted from v1 catalog rewrite.

const PAGE_SIZE = 12;

function StatusPill({ status }: { status: 'Active' | 'Inactive' }) {
  return status === 'Active' ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Inactive
    </span>
  );
}

function categoryLabel(c: CatalogItem['productCategory']): string | null {
  if (!c) return null;
  if (typeof c === 'string') return null;
  return c.name ?? null;
}

function categoryIdOf(c: CatalogItem['productCategory']): string | null {
  if (!c) return null;
  if (typeof c === 'string') return c;
  return c._id ?? null;
}

export function ProductCatalog() {
  const accountType = useAuthStore((s) => s.accountType);
  const isDealer = accountType === 'Dealer';
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState('');

  const query = useProductCatalog({ page, limit: PAGE_SIZE, searchKey });
  const update = useUpdateCatalog();
  const remove = useDeleteCatalog();

  const items = query.data?.data ?? [];
  const totalPages = query.data?.pagination.totalPages ?? 1;

  const onToggleStatus = (item: CatalogItem, nextActive: boolean) => {
    // Reuse existing price rows so the backend's `No valid price entries`
    // guard does not fire on a status toggle.
    const priceMap: Record<string, Array<Record<string, number>>> = {};
    (item.price ?? []).forEach((row) => {
      if (!priceMap[row.volume]) priceMap[row.volume] = [];
      priceMap[row.volume].push({ [row.refId]: row.price });
    });
    update.mutate(
      {
        _id: item._id,
        productDescription: item.productOfferDescription,
        productStatus: nextActive ? 'Active' : 'Inactive',
        productCategory: categoryIdOf(item.productCategory),
        focusProductId: String(item.focusProductId ?? ''),
        focusUnitId: 1,
        focusProductMapping: null,
        price: JSON.stringify(priceMap),
      },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onDelete = (item: CatalogItem) => {
    if (!window.confirm(`Delete product "${item.productOfferDescription}"? This cannot be undone.`)) return;
    remove.mutate(
      { _id: item._id },
      {
        onSuccess: () => toast.success('Product deleted'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const openEdit = (item: CatalogItem) => {
    if (isDealer) return;
    navigate(`/edit-product/${item._id}`, { state: { catalog: item } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Product catalog</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
              className="w-56 pl-8"
            />
          </div>
          {!isDealer && (
            <Button asChild>
              <Link to="/create-product">
                <Plus className="mr-2 h-4 w-4" /> Add product
              </Link>
            </Button>
          )}
        </div>
      </div>

      {query.isError && (
        <p className="text-sm text-destructive">
          Couldn't load: {query.error.message}
        </p>
      )}

      {query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const category = categoryLabel(item.productCategory);
            const status: 'Active' | 'Inactive' =
              item.productOfferStatus === 'Inactive' ? 'Inactive' : 'Active';
            return (
              <Card
                key={item._id}
                role={isDealer ? undefined : 'button'}
                tabIndex={isDealer ? undefined : 0}
                onClick={isDealer ? undefined : () => openEdit(item)}
                onKeyDown={isDealer ? undefined : (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEdit(item);
                  }
                }}
                className={
                  'overflow-hidden ' +
                  (isDealer
                    ? ''
                    : 'cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2')
                }
              >
                <div className="relative">
                  {item.productOfferImageUrl ? (
                    <img
                      src={item.productOfferImageUrl}
                      alt={item.productOfferDescription}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <StatusPill status={status} />
                  </div>
                  {!isDealer && (
                    <div
                      className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/90 p-1 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        aria-label="Edit product"
                      >
                        <Link to={`/edit-product/${item._id}`} state={{ catalog: item }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onDelete(item)}
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {item.productOfferDescription}
                    </h3>
                    {!isDealer && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={status === 'Active'}
                          onCheckedChange={(c) => onToggleStatus(item, c)}
                          aria-label="Toggle product status"
                        />
                      </div>
                    )}
                  </div>
                  {category && (
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {category}
                    </span>
                  )}
                  {typeof item.productPrice === 'number' && item.productPrice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      From: {item.productPrice}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {query.data && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
