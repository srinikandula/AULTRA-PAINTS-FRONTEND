import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogTrigger,
} from '@/components/ui/dialog';
import {
  useProductOffers, useUpdateProductOffer, useDeleteProductOffer,
} from './hooks';
import { OfferFormDialog } from './offer-form-dialog';
import type { ProductOffer } from '@/types/product-offer';

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

function categoryLabel(c: ProductOffer['productCategory']): string | null {
  if (!c) return null;
  if (typeof c === 'string') return null;
  return c.name ?? null;
}

function formatDate(value?: string): string {
  if (!value) return 'No expiry';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export function ProductOffers() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const [editing, setEditing] = useState<ProductOffer | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useProductOffers({
    page,
    limit: PAGE_SIZE,
    searchKey: searchKey || undefined,
  });
  const update = useUpdateProductOffer();
  const remove = useDeleteProductOffer();

  const onToggleStatus = (offer: ProductOffer, nextActive: boolean) => {
    const productCategoryId =
      offer.productCategory && typeof offer.productCategory === 'object'
        ? offer.productCategory._id
        : (offer.productCategory ?? null);
    update.mutate(
      {
        _id: offer._id,
        productOfferDescription: offer.productOfferDescription,
        cashback: offer.cashback,
        redeemPoints: offer.redeemPoints,
        validUntil: offer.validUntil,
        productCategory: productCategoryId,
        productOfferStatus: nextActive ? 'Active' : 'Inactive',
        price: [],
      },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const onDelete = (offer: ProductOffer) => {
    if (!window.confirm(`Delete offer "${offer.productOfferDescription}"? This cannot be undone.`)) return;
    remove.mutate(
      { _id: offer._id },
      {
        onSuccess: () => toast.success('Offer deleted'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const offers = query.data?.data ?? [];
  const totalPages = query.data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Product offers</h1>
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
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New offer</Button>
            </DialogTrigger>
            {creating && <OfferFormDialog onClose={() => setCreating(false)} />}
          </Dialog>
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
      ) : offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No product offers yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => {
            const category = categoryLabel(o.productCategory);
            return (
              <Card
                key={o._id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(o)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setEditing(o);
                  }
                }}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="relative">
                  {o.productOfferImageUrl ? (
                    <img
                      src={o.productOfferImageUrl}
                      alt={o.productOfferDescription}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <StatusPill status={o.productOfferStatus} />
                  </div>
                  <div
                    className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/90 p-1 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditing(o)}
                      aria-label="Edit offer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onDelete(o)}
                      aria-label="Delete offer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {o.productOfferDescription}
                    </h3>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={o.productOfferStatus === 'Active'}
                        onCheckedChange={(c) => onToggleStatus(o, c)}
                        aria-label="Toggle offer status"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cashback: ₹{o.cashback} | Redeem: {o.redeemPoints} pts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Valid until: {formatDate(o.validUntil)}
                  </p>
                  {category && (
                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {category}
                    </span>
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <OfferFormDialog offer={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
