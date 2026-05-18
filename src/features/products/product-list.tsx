import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useProducts, useDeleteProduct } from './hooks';

export function ProductList() {
  const [page, setPage] = useState(1);
  const [searchKey, setSearchKey] = useState('');
  const limit = 20;
  const { data, isLoading, isError, error } = useProducts({ page, limit, searchKey });
  const remove = useDeleteProduct();

  const brandName = (b: NonNullable<typeof data>['data'][number]['brand']) =>
    typeof b === 'string' ? b : b?.brandName ?? '—';
  const categoryName = (c: NonNullable<typeof data>['data'][number]['category']) =>
    typeof c === 'string' ? c : c?.categoryName ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button asChild><Link to="/create-product"><Plus className="mr-2 h-4 w-4" /> New product</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search by name or code…"
            value={searchKey}
            onChange={(e) => { setSearchKey(e.target.value); setPage(1); }}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isError && <p className="text-sm text-destructive">Couldn't load: {error.message}</p>}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Redeem</TableHead>
                    <TableHead>Cashback</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.productCode}</TableCell>
                      <TableCell>{p.productName}</TableCell>
                      <TableCell>{brandName(p.brand)}</TableCell>
                      <TableCell>{categoryName(p.category)}</TableCell>
                      <TableCell>{p.price ?? '—'}</TableCell>
                      <TableCell>{p.redeemPoints ?? 0}</TableCell>
                      <TableCell>{p.cashback ?? 0}</TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/edit-product/${p._id}`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove.mutate(
                            { _id: p._id },
                            {
                              onSuccess: () => toast.success('Product deleted'),
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
              {data && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {data.pagination.totalPages}</span>
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
