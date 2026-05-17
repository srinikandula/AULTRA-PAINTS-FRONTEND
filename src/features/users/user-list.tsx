import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useUsers, useToggleUserStatus, useDeleteUser } from './hooks';
import { UserFormDialog } from './user-form-dialog';
import type { User, UserAccountType } from '@/types/user';

const ALL = '__all__';

const ACCOUNT_TYPES: UserAccountType[] = [
  'Painter', 'Contractor', 'Dealer', 'SuperUser', 'SalesExecutive',
];

const PAGE_SIZES = [10, 20, 50, 100];

export function UserList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchKey, setSearchKey] = useState('');
  const [accountType, setAccountType] = useState<UserAccountType | undefined>(undefined);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading, isError, error } = useUsers({
    page,
    limit,
    searchKey,
    accountType,
  });
  const toggleStatus = useToggleUserStatus();
  const remove = useDeleteUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New user</Button>
          </DialogTrigger>
          {creating && <UserFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by name or mobile..."
              value={searchKey}
              onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
            <Select
              value={accountType ?? ALL}
              onValueChange={(v) => {
                setAccountType(v === ALL ? undefined : (v as UserAccountType));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48"><SelectValue placeholder="Account type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      <TableCell>{u.name || '-'}</TableCell>
                      <TableCell>{u.mobile}</TableCell>
                      <TableCell>{u.accountType}</TableCell>
                      <TableCell>{u.dealerCode ?? '-'}</TableCell>
                      <TableCell>
                        <Link
                          to={`/transactions?userId=${u._id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {u.rewardPoints ?? 0}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/transactions?userId=${u._id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {u.cash ?? 0}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.status === 'active'}
                          onCheckedChange={() => toggleStatus.mutate(
                            { _id: u._id },
                            {
                              onSuccess: () => toast.success(`User ${u.mobile} updated`),
                              onError: (e) => toast.error(e.message),
                            },
                          )}
                          aria-label={`Toggle status for ${u.mobile}`}
                        />
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!window.confirm(`Delete user ${u.mobile}?`)) return;
                            remove.mutate(
                              { _id: u._id },
                              {
                                onSuccess: () => toast.success('User deleted'),
                                onError: (e) => toast.error(e.message),
                              },
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                {data && data.pagination.totalPages > 1 && (
                  <>
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
                  </>
                )}
                <Select
                  value={String(limit)}
                  onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
                >
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
