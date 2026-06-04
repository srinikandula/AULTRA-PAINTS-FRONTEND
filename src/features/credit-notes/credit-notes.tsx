import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { useCreditNotes, openCreditNotePdf } from './hooks';
import { IssueCreditNoteDialog } from './issue-credit-note-dialog';
import type { CreditNote } from '@/types/credit-note';

const ALL = '__all__';
const STATUS_OPTIONS: CreditNote['status'][] = ['issued', 'redeemed', 'cancelled'];
const BALANCE_TYPE_OPTIONS: CreditNote['balanceType'][] = ['rewardPoints', 'cash'];

function PdfButton({ creditNoteNumber }: { creditNoteNumber: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await openCreditNotePdf(creditNoteNumber);
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

export function CreditNotes() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CreditNote['status'] | undefined>(undefined);
  const [balanceType, setBalanceType] = useState<CreditNote['balanceType'] | undefined>(undefined);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [issuing, setIssuing] = useState(false);
  const limit = 20;

  const { data, isLoading, isError, error } = useCreditNotes({
    page,
    limit,
    status,
    balanceType,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Credit notes</h1>
        <Button onClick={() => setIssuing(true)}>
          <Plus className="mr-2 h-4 w-4" /> Issue credit note
        </Button>
      </div>

      <IssueCreditNoteDialog open={issuing} onOpenChange={setIssuing} />

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={status ?? ALL}
              onValueChange={(v) => {
                setStatus(v === ALL ? undefined : (v as CreditNote['status']));
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={balanceType ?? ALL}
              onValueChange={(v) => {
                setBalanceType(v === ALL ? undefined : (v as CreditNote['balanceType']));
                setPage(1);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Balance type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All</SelectItem>
                {BALANCE_TYPE_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-destructive">Couldn't load credit notes: {error.message}</p>
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
                    <TableHead>Credit note #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Balance type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Narration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((n) => (
                    <TableRow key={n._id}>
                      <TableCell>{n.creditNoteNumber}</TableCell>
                      <TableCell>{new Date(n.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{n.balanceType}</TableCell>
                      <TableCell>{n.amount}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs">{n.status}</span>
                      </TableCell>
                      <TableCell>{n.narration ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <PdfButton creditNoteNumber={n.creditNoteNumber} />
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
