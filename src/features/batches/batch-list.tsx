import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useBatches, useDeleteBatch } from './hooks';
import type { Batch } from '@/types/batch';

export function BatchList() {
  const { data, isLoading, isError, error } = useBatches();
  const remove = useDeleteBatch();

  const productName = (p: Batch['product']) =>
    typeof p === 'string' ? p : p?.productName ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Batches</h1>
        <Button asChild><Link to="/create-batch"><Plus className="mr-2 h-4 w-4" /> New batch</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All batches</CardTitle></CardHeader>
        <CardContent>
          {isError && <p className="text-sm text-destructive">Couldn't load: {error.message}</p>}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Manufactured</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Coupon series</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>{b.batchNumber}</TableCell>
                    <TableCell>{productName(b.product)}</TableCell>
                    <TableCell>{b.manufacturedDate ?? '—'}</TableCell>
                    <TableCell>{b.expiryDate ?? '—'}</TableCell>
                    <TableCell>{b.quantity ?? 0}</TableCell>
                    <TableCell>{`${b.couponSeriesStart ?? '—'}–${b.couponSeriesEnd ?? '—'}`}</TableCell>
                    <TableCell>{b.status ?? '—'}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove.mutate(
                          { _id: b._id },
                          {
                            onSuccess: () => toast.success('Batch deleted'),
                            onError: (e) => toast.error(e.message),
                          },
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
