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
import { ConfirmDialog } from '@/components/confirm-dialog';
import { cacheBust } from '@/lib/cache-bust';
import {
  useDeals, useUpdateDeal, useDeleteDeal,
} from './hooks';
import { DealFormDialog } from './deal-form-dialog';
import type { Deal } from '@/types/deal';

const PAGE_SIZE = 12;

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Inactive
    </span>
  );
}

function categoryLabel(c: Deal['category']): string | null {
  if (!c) return null;
  if (typeof c === 'string') return null;
  return c.categoryName ?? null;
}

function formatDate(value?: string): string {
  if (!value) return 'No expiry';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function isExpired(value: string): boolean {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export function Deals() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Deal | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Deal | null>(null);

  const query = useDeals({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
  });
  const update = useUpdateDeal();
  const remove = useDeleteDeal();

  const onToggleStatus = (deal: Deal, nextActive: boolean) => {
    update.mutate(
      { _id: deal._id, active: nextActive },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(
      { _id: deleting._id },
      {
        onSuccess: () => { toast.success('Deal deleted'); setDeleting(null); },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const deals = query.data?.data ?? [];
  const totalPages = query.data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Deals</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56 pl-8"
            />
          </div>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New deal</Button>
            </DialogTrigger>
            {creating && <DealFormDialog onClose={() => setCreating(false)} />}
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
      ) : deals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deals yet — create your first one.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((d) => {
            const category = categoryLabel(d.category);
            const expired = isExpired(d.expirationDate);
            return (
              <Card
                key={d._id}
                role="button"
                tabIndex={0}
                onClick={() => setEditing(d)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setEditing(d);
                  }
                }}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="relative">
                  {d.dealImageUrl ? (
                    <img
                      src={cacheBust(d.dealImageUrl, d.updatedAt) ?? undefined}
                      alt={d.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex items-center gap-1">
                    <StatusPill active={d.active} />
                    {expired && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Expired
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-background/90 p-1 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="icon"
                      variant="editIcon"
                      className="h-7 w-7"
                      onClick={() => setEditing(d)}
                      aria-label="Edit deal"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructiveIcon"
                      className="h-7 w-7"
                      onClick={() => setDeleting(d)}
                      aria-label="Delete deal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {d.title}
                    </h3>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={d.active}
                        onCheckedChange={(c) => onToggleStatus(d, c)}
                        aria-label="Toggle deal active"
                      />
                    </div>
                  </div>
                  {d.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {d.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Expires: {formatDate(d.expirationDate)}
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
        {editing && <DealFormDialog deal={editing} onClose={() => setEditing(null)} />}
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete deal?"
        description={
          deleting && (
            <>
              <strong className="font-medium text-foreground">
                {deleting.title}
              </strong>{' '}
              will be permanently removed. This cannot be undone.
            </>
          )
        }
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
