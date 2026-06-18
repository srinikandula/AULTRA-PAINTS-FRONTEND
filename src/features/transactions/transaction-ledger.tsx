import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useLedger, openLedgerPdf } from './hooks';

const ALL = '__all__';
type CreditNoteStatus = 'pending' | 'issued';

function PdfButton({ rowId }: { rowId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await openLedgerPdf(rowId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open PDF');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? 'Loading…' : 'PDF'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function TransactionLedger() {
  const [page, setPage] = useState(1);
  const [creditNoteStatus, setCreditNoteStatus] = useState<CreditNoteStatus | undefined>(undefined);
  const [couponCode, setCouponCode] = useState('');
  const [dealerCode, setDealerCode] = useState('');
  const [dealerName, setDealerName] = useState('');
  const [date, setDate] = useState('');
  const limit = 20;

  const { data, isLoading, isError, error } = useLedger({
    page,
    limit,
    creditNoteStatus,
    couponCode: couponCode || undefined,
    dealerCode: dealerCode || undefined,
    dealerName: dealerName || undefined,
    date: date || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaction ledger</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              value={creditNoteStatus ?? ALL}
              onValueChange={(v) => {
                setCreditNoteStatus(v === ALL ? undefined : (v as CreditNoteStatus));
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Credit note status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value); setPage(1); }}
            />

            <Input
              placeholder="Dealer code"
              value={dealerCode}
              onChange={(e) => { setDealerCode(e.target.value); setPage(1); }}
            />

            <Input
              placeholder="Dealer name"
              value={dealerName}
              onChange={(e) => { setDealerName(e.target.value); setPage(1); }}
            />

            <Input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive">Couldn't load ledger: {error.message}</p>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead>Points credited</TableHead>
                    <TableHead>Points balance</TableHead>
                    <TableHead>Cash reward</TableHead>
                    <TableHead>Cash balance</TableHead>
                    <TableHead>Unique code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{row.narration}</TableCell>
                      <TableCell>{row.pointsCredited ?? '—'}</TableCell>
                      <TableCell>{row.pointsBalance ?? 0}</TableCell>
                      <TableCell>{row.cashReward ?? 0}</TableCell>
                      <TableCell>{row.cashBalance ?? 0}</TableCell>
                      <TableCell>{row.uniqueCode ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <PdfButton rowId={row._id} />
                      </TableCell>
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
