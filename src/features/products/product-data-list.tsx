import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useBatchStatisticsList } from './hooks';
import { env } from '@/env';
import { useAuthStore } from '@/stores/auth-store';

export function ProductDataList() {
  const [page, setPage] = useState(1);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  const query = useBatchStatisticsList({ page, limit, branches: selectedBranches });
  const allBranches = query.data?.branches ?? [];
  const allSelected = allBranches.length > 0 && selectedBranches.length === allBranches.length;

  const toggleBranch = (b: string) => {
    setSelectedBranches((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
    setPage(1);
  };

  const toggleAll = () => {
    setSelectedBranches(allSelected ? [] : [...allBranches]);
    setPage(1);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(
        `${env.apiUrl.replace(/\/$/, '')}/chart/export-batch-statistics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/csv',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ branches: selectedBranches }),
        },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Export failed (${res.status})${body ? `: ${body.slice(0, 200)}` : ''}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Batch statistics</h1>
        <Button onClick={onExport} disabled={exporting || query.isLoading}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[12rem] justify-between">
                  {selectedBranches.length === 0
                    ? 'All branches'
                    : selectedBranches.length === 1
                      ? selectedBranches[0]
                      : `${selectedBranches.length} branches`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-0">
                <div className="border-b p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                    Select all
                  </label>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {allBranches.length === 0 && (
                    <p className="px-2 py-3 text-sm text-muted-foreground">
                      {query.isLoading ? 'Loading branches…' : 'No branches found'}
                    </p>
                  )}
                  {allBranches.map((b) => (
                    <label
                      key={b}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedBranches.includes(b)}
                        onCheckedChange={() => toggleBranch(b)}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {selectedBranches.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedBranches([]); setPage(1); }}
              >
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {query.isError && (
            <p className="text-sm text-destructive">Couldn't load: {query.error.message}</p>
          )}
          {query.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Issued Points</TableHead>
                    <TableHead className="text-right">Issued Cash</TableHead>
                    <TableHead className="text-right">Redeemed Points</TableHead>
                    <TableHead className="text-right">Redeemed Cash</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data?.data.map((row, i) => (
                    <TableRow key={`${row.name}-${i}`}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.branch}</TableCell>
                      <TableCell className="text-right">{row.issuedPoints}</TableCell>
                      <TableCell className="text-right">{row.issuedCash}</TableCell>
                      <TableCell className="text-right">{row.redeemedPoints}</TableCell>
                      <TableCell className="text-right">{row.redeemedCash}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {query.data?.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        No batch statistics found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {query.data && query.data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {query.data.pagination.totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= query.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
