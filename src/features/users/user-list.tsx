import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useUsers, useToggleUserStatus, useResetUserPassword } from './hooks';

export function UserList() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const limit = 20;

  const { data, isLoading, isError, error } = useUsers({ page, limit, searchKey });
  const toggleStatus = useToggleUserStatus();
  const resetPassword = useResetUserPassword();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name or mobile…"
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive">Couldn't load users: {error.message}</p>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dealer code</TableHead>
                    <TableHead>Reward pts</TableHead>
                    <TableHead>Cash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>{u.name || '—'}</TableCell>
                      <TableCell>{u.mobile}</TableCell>
                      <TableCell>{u.accountType}</TableCell>
                      <TableCell>{u.dealerCode ?? '—'}</TableCell>
                      <TableCell>{u.rewardPoints ?? 0}</TableCell>
                      <TableCell>{u.cash ?? 0}</TableCell>
                      <TableCell>{u.status}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus.mutate(
                            { _id: u._id },
                            {
                              onSuccess: () => toast.success(`User ${u.mobile} updated`),
                              onError: (e) => toast.error(e.message),
                            },
                          )}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetPassword.mutate(
                            { mobile: u.mobile },
                            {
                              onSuccess: () => toast.success(`Password reset for ${u.mobile}`),
                              onError: (e) => toast.error(e.message),
                            },
                          )}
                        >
                          Reset password
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
