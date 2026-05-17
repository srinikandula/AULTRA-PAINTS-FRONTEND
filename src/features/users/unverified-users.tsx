import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useUnverifiedUsers, useVerifyUser } from './hooks';

export function UnverifiedUsers() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isError, error } = useUnverifiedUsers({ page, limit });
  const verify = useVerifyUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Unverified users</h1>
      <Card>
        <CardHeader><CardTitle>Pending verification</CardTitle></CardHeader>
        <CardContent>
          {isError && <p className="text-sm text-destructive">Couldn't load: {error.message}</p>}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dealer code</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.name || '—'}</TableCell>
                      <TableCell>{u.mobile}</TableCell>
                      <TableCell>{u.accountType}</TableCell>
                      <TableCell>{u.dealerCode ?? u.parentDealerCode ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => verify.mutate(
                            { _id: u._id },
                            {
                              onSuccess: () => toast.success(`Verified ${u.mobile}`),
                              onError: (e) => toast.error(e.message),
                            },
                          )}
                        >
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data.pagination.totalPages}
                  </span>
                  <Button size="sm" variant="outline" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
