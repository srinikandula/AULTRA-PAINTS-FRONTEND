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
import { useLedger, ledgerPdfUrl } from './hooks';

const ALL = '__all__';
type TxType = 'points' | 'cash';

export function TransactionLedger() {
  const [page, setPage] = useState(1);
  const [transactionType, setTransactionType] = useState<TxType | undefined>(undefined);
  const [couponCode, setCouponCode] = useState('');
  const [date, setDate] = useState('');
  const limit = 20;

  const { data, isLoading, isError, error } = useLedger({
    page,
    limit,
    transactionType,
    couponCode: couponCode || undefined,
    date: date || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaction ledger</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={transactionType ?? ALL}
              onValueChange={(v) => {
                setTransactionType(v === ALL ? undefined : (v as TxType));
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                <SelectItem value="points">Points</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value); setPage(1); }}
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
                        <Button asChild variant="outline" size="sm">
                          <a href={ledgerPdfUrl(row._id)} target="_blank" rel="noreferrer">PDF</a>
                        </Button>
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
