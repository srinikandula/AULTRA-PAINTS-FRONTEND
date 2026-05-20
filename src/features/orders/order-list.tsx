import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  useOrders,
  useDealers,
  useOrderDetails,
  useRetryFocusSync,
  useSalesExecutives,
  useFocusBranches,
  useUpdateOrderStatusManual,
} from './hooks';
import { useAuthStore } from '@/stores/auth-store';
import type { FocusSyncStatus, Order, OrderStatus } from '@/types/order';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING', 'VERIFIED', 'REJECTED', 'DISPATCHED', 'PARTIALLY_DISPATCHED', 'MANUALLY_DISPATCHED',
];

const ALL = '__all__';
// 9 cells per row: chevron + Order # + Dealer + Items + Total + Status + Focus + Created + Actions.
const COLUMN_COUNT = 9;

// Tailwind colored pill matching the Angular legend.
const STATUS_STYLES: Record<OrderStatus, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'VERIFIED': 'bg-blue-100 text-blue-800 border-blue-200',
  'REJECTED': 'bg-red-100 text-red-800 border-red-200',
  'DISPATCHED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'PARTIALLY_DISPATCHED': 'bg-violet-100 text-violet-800 border-violet-200',
  'MANUALLY_DISPATCHED': 'bg-teal-100 text-teal-800 border-teal-200',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-foreground border-muted';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

const FOCUS_STYLES: Record<FocusSyncStatus, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'SUCCESS': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'FAILED': 'bg-red-100 text-red-800 border-red-200',
};

function FocusSyncBadge({ status }: { status?: FocusSyncStatus }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const cls = FOCUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function formatCurrency(value: number | undefined) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `Rs.${n.toLocaleString('en-IN')}`;
}

function dealerName(o: Order): string {
  if (o.dealer?.name) return o.dealer.name;
  if (o.dealerId && typeof o.dealerId === 'object') return o.dealerId.name;
  return '—';
}

export function OrderList() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  // Backend filters dealers by code, not by _id.
  const [dealerCode, setDealerCode] = useState<string | undefined>(undefined);
  const [salesExecutiveMobile, setSalesExecutiveMobile] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [expandedOrderId, setExpandedOrderId] = useState<string | undefined>(undefined);
  const limit = 20;

  const accountType = useAuthStore((s) => s.accountType);
  const canFilterByBranch = accountType === 'SuperUser' || accountType === 'ProductionManager';
  const canManualDispatch = accountType === 'SuperUser' || accountType === 'ProductionManager';

  // Manual dispatch dialog state (lifted to row level)
  const manualDispatch = useUpdateOrderStatusManual();
  const [manualDispatchOrderId, setManualDispatchOrderId] = useState<string | undefined>(undefined);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualRemarks, setManualRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  function openManualDialog(orderId: string) {
    setManualDispatchOrderId(orderId);
    setManualRemarks('');
    setRemarksError('');
    setShowManualDialog(true);
  }

  const dealers = useDealers();
  const salesExecutives = useSalesExecutives();
  const branches = useFocusBranches();
  const { data, isLoading, isError, error } = useOrders({
    page,
    limit,
    status,
    dealerCode,
    salesExecutiveMobile,
    branchId,
  });

  const filtersActive = !!status || !!dealerCode || !!salesExecutiveMobile || !!branchId;

  function clearFilters() {
    setStatus(undefined);
    setDealerCode(undefined);
    setSalesExecutiveMobile(undefined);
    setBranchId(undefined);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={status ?? ALL}
              onValueChange={(v) => {
                setStatus(v === ALL ? undefined : (v as OrderStatus));
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* TODO: replace the dealer Select with a Combobox typeahead — the live list
                is ~3500 dealers. Same future-work as the Credit Notes Issue dialog. */}
            <Select
              value={dealerCode ?? ALL}
              onValueChange={(v) => {
                setDealerCode(v === ALL ? undefined : v);
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Dealer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All dealers</SelectItem>
                {dealers.data?.map((d) => (
                  <SelectItem
                    key={d._id}
                    value={d.dealerCode ?? d._id}
                  >{`${d.name}${d.dealerCode ? ` (${d.dealerCode})` : ''}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* TODO: the SE filter currently uses the SE's mobile number as
                `salesExecutiveMobile`. Cross-check with the backend ORDER
                controller's actual filter param if SE-scoping ever returns
                wrong rows. */}
            <Select
              value={salesExecutiveMobile ?? ALL}
              onValueChange={(v) => {
                setSalesExecutiveMobile(v === ALL ? undefined : v);
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Sales Executive" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sales executives</SelectItem>
                {salesExecutives.data?.map((se) => (
                  <SelectItem key={se.id} value={se.mobile}>
                    {se.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canFilterByBranch ? (
              <Select
                value={branchId !== undefined ? String(branchId) : ALL}
                onValueChange={(v) => {
                  setBranchId(v === ALL ? undefined : Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All branches</SelectItem>
                  {branches.data?.map((b) => (
                    <SelectItem key={b.iMasterId} value={String(b.iMasterId)}>
                      {b.sName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center">
                {filtersActive && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
          {canFilterByBranch && filtersActive && (
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive">Couldn't load orders: {error.message}</p>
          )}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Order #</TableHead>
                    <TableHead>Dealer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Focus</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((o) => {
                    const rowOrderId = o.orderId ?? o.orderNumber ?? o._id;
                    const isExpanded = expandedOrderId === rowOrderId;
                    return (
                      <Fragment key={o._id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() =>
                            setExpandedOrderId(isExpanded ? undefined : rowOrderId)
                          }
                        >
                          <TableCell className="w-8 align-middle">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell>{o.orderNumber ?? o.orderId}</TableCell>
                          <TableCell>{dealerName(o)}</TableCell>
                          <TableCell>{o.items.length}</TableCell>
                          <TableCell>{formatCurrency(o.totalAmount ?? o.finalPrice)}</TableCell>
                          <TableCell><StatusBadge status={o.status} /></TableCell>
                          <TableCell><FocusSyncBadge status={o.focusSyncStatus} /></TableCell>
                          <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                            {canManualDispatch && (
                              <button
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                title="Mark as manually dispatched"
                                onClick={() => openManualDialog(o.orderId ?? o.orderNumber ?? o._id)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={COLUMN_COUNT} className="bg-muted/30 p-0">
                              <OrderDetailPanel orderId={rowOrderId} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              {data && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showManualDialog} onOpenChange={(open) => { if (!open) setShowManualDialog(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Manual dispatch</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
              <Select value="MANUALLY_DISPATCHED" onValueChange={() => {}}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUALLY_DISPATCHED">Manually Dispatched</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">
                Remarks <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Enter DC Invoice ID or remarks"
                value={manualRemarks}
                onChange={(e) => {
                  setManualRemarks(e.target.value);
                  if (e.target.value.trim()) setRemarksError('');
                }}
                rows={2}
                className={remarksError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {remarksError && <p className="text-xs text-destructive">{remarksError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={manualDispatch.isPending}
              onClick={() => {
                if (!manualRemarks.trim()) {
                  setRemarksError('Remarks is required');
                  return;
                }
                manualDispatch.mutate(
                  {
                    orderId: manualDispatchOrderId!,
                    status: 'MANUALLY_DISPATCHED',
                    remarks: manualRemarks.trim(),
                  },
                  {
                    onSuccess: (res) => {
                      toast.success(res?.message ?? 'Status updated');
                      setShowManualDialog(false);
                    },
                    onError: (e) => toast.error(e.message),
                  },
                );
              }}
            >
              {manualDispatch.isPending ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Detail panel rendered inside the expanded sub-row. Owns its own fetch via
// `useOrderDetails(orderId)` (only enabled when expanded, so collapsed rows
// don't pre-fetch). The retry-sync button only renders when the order is in
// FAILED state (backend rejects retry once status === SUCCESS).
function OrderDetailPanel({ orderId }: { orderId: string }) {
  const detailsQuery = useOrderDetails(orderId);
  const retrySync = useRetryFocusSync();

  if (detailsQuery.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (detailsQuery.error) {
    return (
      <p className="p-4 text-sm text-destructive">
        Couldn't load details: {detailsQuery.error.message}
      </p>
    );
  }
  const o = detailsQuery.data;
  if (!o) return null;

  const subTotal = o.subTotal ?? o.totalPrice ?? 0;
  const gst = o.gst ?? o.gstPrice ?? 0;
  const total = o.finalPrice ?? o.totalAmount ?? 0;
  const placedByName = o.createdBy?.name ?? '—';
  const placedByType = o.createdBy?.accountType ? ` (${o.createdBy.accountType})` : '';

  return (
    <div className="space-y-4 p-4">
      <section>
        <h4 className="text-sm font-semibold mb-2">Items</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {o.items.map((it, idx) => {
              const name =
                it.productName ??
                it.productOfferDescription ??
                (typeof it.product === 'object' ? it.product?.productName : '') ??
                '—';
              const unit = it.productPrice ?? it.price ?? 0;
              const line = it.subTotal ?? it.quantity * unit;
              return (
                <TableRow key={idx}>
                  <TableCell>{name}</TableCell>
                  <TableCell>{it.volume ?? '—'}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{formatCurrency(unit)}</TableCell>
                  <TableCell>{formatCurrency(line)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <section className="grid grid-cols-3 gap-4 text-sm">
        <div>Subtotal: {formatCurrency(subTotal)}</div>
        <div>GST: {formatCurrency(gst)}</div>
        <div className="font-semibold">Total: {formatCurrency(total)}</div>
      </section>

      <section>
        <h4 className="text-sm font-semibold mb-2">Focus Sync</h4>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <FocusSyncBadge status={o.focusSyncStatus} />
          {o.focusOrderId ? <span>Voucher #{o.focusOrderId}</span> : null}
          {o.dcInvoiceIds && o.dcInvoiceIds.length > 0 ? (
            <span>DC: {o.dcInvoiceIds.join(', ')}</span>
          ) : null}
          {o.focusSyncStatus === 'FAILED' && (
            <Button
              size="sm"
              variant="outline"
              disabled={retrySync.isPending}
              onClick={() =>
                retrySync.mutate(
                  { orderId: o.orderId ?? orderId },
                  {
                    onSuccess: (res) =>
                      toast.success(res?.message ?? 'Sync queued'),
                    onError: (e) => toast.error(e.message),
                  },
                )
              }
            >
              {retrySync.isPending ? 'Retrying...' : 'Retry sync'}
            </Button>
          )}
        </div>
        {o.focusSyncError && (
          <p className="text-xs text-destructive mt-1">{o.focusSyncError}</p>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold mb-2">Order details</h4>
        <div className="flex gap-4 text-sm">
          <div className="flex-1 space-y-1">
            <div>Dealer: {dealerName(o)}</div>
            {o.narration ? <div>Narration: {o.narration}</div> : null}
          </div>
          <div className="flex-1 space-y-1">
            <div>Placed by: {placedByName}{placedByType}</div>
            {o.branchName ? <div>Branch: {o.branchName}</div> : null}
          </div>
        </div>
      </section>

      {o.statusHistory && o.statusHistory.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold mb-2">Status history</h4>
          <div className="space-y-1">
            {o.statusHistory.map((h, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                <StatusBadge status={h.status as OrderStatus} />
                <span>{new Date(h.changedAt).toLocaleString()}</span>
                {h.changedBy?.name && (
                  <span>by {h.changedBy.name}{h.changedBy.accountType ? ` (${h.changedBy.accountType})` : ''}</span>
                )}
                {h.remarks && <span className="italic">— {h.remarks}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
