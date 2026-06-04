import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useTransactions, exportTransactions } from './hooks';

// Matches the export format: D-M-YYYY h:mm A  (e.g. 4-6-2026 2:30 PM)
function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const day   = d.getDate();
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  const h     = d.getHours();
  const min   = String(d.getMinutes()).padStart(2, '0');
  const ampm  = h >= 12 ? 'PM' : 'AM';
  const hour  = h % 12 || 12;
  return `${day}-${month}-${year} ${hour}:${min} ${ampm}`;
}

export function Transactions() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const [showUsedCoupons, setShowUsedCoupons] = useState(false);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  const { data, isLoading, isError, error } = useTransactions({
    page,
    limit,
    searchKey,
    showUsedCoupons,
  });

  async function handleExport() {
    setExporting(true);
    try {
      await exportTransactions({ searchKey: searchKey || undefined, showUsedCoupons });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search by coupon code or UDID…"
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <Switch
                id="used"
                checked={showUsedCoupons}
                onCheckedChange={(v) => { setShowUsedCoupons(v); setPage(1); }}
              />
              <label htmlFor="used" className="text-sm">Show used coupons</label>
            </div>
            <div className="ml-auto">
              <Button variant="outline" onClick={handleExport} disabled={exporting}>
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting…' : 'Export'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive">Couldn't load transactions: {error.message}</p>
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
                    <TableHead>Coupon #</TableHead>
                    <TableHead>UDID</TableHead>
                    <TableHead>Points reward</TableHead>
                    <TableHead>Cash reward</TableHead>
                    <TableHead>Redeemed by (pts)</TableHead>
                    <TableHead>Redeemed at (pts)</TableHead>
                    <TableHead>Redeemed by (cash)</TableHead>
                    <TableHead>Redeemed at (cash)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>{t.couponCode}</TableCell>
                      <TableCell>{t.UDID ?? '—'}</TableCell>
                      <TableCell>{t.redeemablePoints ?? 0}</TableCell>
                      <TableCell>{t.value ?? 0}</TableCell>
                      <TableCell>{t.pointsRedeemedBy ?? '—'}</TableCell>
                      <TableCell>{fmtDate(t.pointsRedeemedAt)}</TableCell>
                      <TableCell>{t.cashRedeemedBy ?? '—'}</TableCell>
                      <TableCell>{fmtDate(t.cashRedeemedAt)}</TableCell>
                    </TableRow>
                  ))}
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
    </div>
  );
}
