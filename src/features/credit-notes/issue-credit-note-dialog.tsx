import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useDealers, useIssueCreditNote } from './hooks';

const schema = z.object({
  userId: z.string().min(1, 'Pick a dealer'),
  balanceType: z.enum(['rewardPoints', 'cash']),
  // react-hook-form gives strings from <Input type="number">; coerce + clamp here.
  amount: z.coerce.number().int('Whole numbers only').positive('Amount must be positive'),
  narration: z.string().optional(),
});

type IssueValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function IssueCreditNoteDialog({ open, onOpenChange }: Props) {
  const dealers = useDealers();
  const issue = useIssueCreditNote();

  const form = useForm<IssueValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: '',
      balanceType: 'rewardPoints',
      amount: 0,
      narration: '',
    },
  });

  // useWatch (instead of form.watch) gives proper reactivity to the dialog body.
  const userId = useWatch({ control: form.control, name: 'userId' });
  const balanceType = useWatch({ control: form.control, name: 'balanceType' });
  const selectedDealer = dealers.data?.find((d) => d._id === userId);
  const available =
    balanceType === 'rewardPoints'
      ? selectedDealer?.rewardPoints ?? 0
      : selectedDealer?.cash ?? 0;

  const onSubmit = form.handleSubmit((values) => {
    issue.mutate(
      {
        userId: values.userId,
        balanceType: values.balanceType,
        amount: values.amount,
        narration: values.narration || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`Credit note ${res.creditNote.creditNoteNumber} issued`);
          onOpenChange(false);
          form.reset();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue credit note</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormLabel>Dealer</FormLabel>
                <FormControl>
                  <Combobox
                    options={(dealers.data ?? []).map((d) => ({
                      value: d._id,
                      label: d.name,
                      hint: d.dealerCode ? `${d.mobile} (${d.dealerCode})` : d.mobile,
                      keywords: `${d.mobile} ${d.dealerCode ?? ''}`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={dealers.isLoading ? 'Loading dealers…' : 'Pick a dealer'}
                    searchPlaceholder="Search dealer..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Live balance preview for the selected dealer. */}
            {selectedDealer && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="font-medium">{selectedDealer.name}</div>
                <div className="mt-1 flex flex-wrap gap-4 text-muted-foreground">
                  <span>
                    Reward Points: <span className="font-medium text-foreground">{selectedDealer.rewardPoints ?? 0}</span>
                  </span>
                  <span>
                    Cash: <span className="font-medium text-foreground">{selectedDealer.cash ?? 0}</span>
                  </span>
                </div>
              </div>
            )}

            <FormField control={form.control} name="balanceType" render={({ field }) => (
              <FormItem>
                <FormLabel>Debit from</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rewardPoints">Reward Points</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Amount{selectedDealer ? ` (available: ${available})` : ''}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="narration" render={({ field }) => (
              <FormItem>
                <FormLabel>Narration (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={issue.isPending}>
                {issue.isPending ? 'Issuing…' : 'Issue credit note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
