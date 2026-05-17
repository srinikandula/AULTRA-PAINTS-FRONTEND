import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Info } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { usePayouts, useBulkPeBalance } from './hooks';

export function Payouts() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const list = usePayouts({ page, limit });
  const balance = useBulkPeBalance();

  const isDisabled =
    (list.error?.status === 410 && list.error?.code === 'CASH_REDEMPTION_DISABLED') ||
    (balance.error?.status === 410 && balance.error?.code === 'CASH_REDEMPTION_DISABLED');

  if (isDisabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Cash redemption retired</AlertTitle>
          <AlertDescription>
            Cash redemption via payment gateway has been retired. The Payouts screen is no
            longer wired to a live processor.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <div className="text-sm text-muted-foreground">
          Available balance: {balance.isLoading ? '…' : balance.data?.availableBalance ?? '—'}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
        <CardContent>
          {list.isError && (
            <p className="text-sm text-destructive">Couldn't load: {list.error.message}</p>
          )}
          {list.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer ID</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>UTR</TableHead>
                    <TableHead>Added on</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data?.data.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.transfer_id}</TableCell>
                      <TableCell>{p.beneficiary_details?.beneName ?? '—'}</TableCell>
                      <TableCell>{p.transfer_amount}</TableCell>
                      <TableCell>{p.transfer_mode ?? '—'}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>{p.transfer_utr ?? '—'}</TableCell>
                      <TableCell>{p.added_on ?? p.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {list.data && list.data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {list.data.pagination.totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= list.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
