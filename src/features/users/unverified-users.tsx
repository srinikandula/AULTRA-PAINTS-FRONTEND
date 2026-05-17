import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useUnverifiedUsers } from './hooks';
import { UserFormDialog } from './user-form-dialog';
import type { User } from '@/types/user';

export function UnverifiedUsers() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const limit = 20;

  const { data, isLoading, isError, error } = useUnverifiedUsers({ page, limit, searchKey });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Unverified users</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending verification</CardTitle>
          <div className="mt-2">
            <Input
              placeholder="Search by name or mobile..."
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
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
                      <TableCell>{u.name || '-'}</TableCell>
                      <TableCell>{u.mobile}</TableCell>
                      <TableCell>{u.accountType}</TableCell>
                      <TableCell>{u.dealerCode ?? u.parentDealerCode ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                          <Pencil className="h-4 w-4" />
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <UserFormDialog user={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
