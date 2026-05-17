import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useRewardSchemes, useCreateRewardScheme, useUpdateRewardScheme, useDeleteRewardScheme,
} from './hooks';
import type { RewardScheme } from '@/types/reward-scheme';

const schemeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  rewardSchemeImageUrl: z.string().url('Must be a URL').optional().or(z.literal('')),
  pointsThreshold: z.coerce.number().int().nonnegative().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});
type SchemeValues = z.infer<typeof schemeSchema>;

function SchemeFormDialog({ scheme, onClose }: { scheme?: RewardScheme; onClose: () => void }) {
  const create = useCreateRewardScheme();
  const update = useUpdateRewardScheme();
  const form = useForm<SchemeValues>({
    resolver: zodResolver(schemeSchema),
    defaultValues: {
      name: scheme?.name ?? '',
      description: scheme?.description ?? '',
      rewardSchemeImageUrl: scheme?.rewardSchemeImageUrl ?? '',
      pointsThreshold: scheme?.pointsThreshold,
      validFrom: scheme?.validFrom ?? '',
      validUntil: scheme?.validUntil ?? '',
    },
  });
  const onSubmit = form.handleSubmit((values) => {
    const mutator = (scheme ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const payload = scheme ? { _id: scheme._id, ...values } : values;
    mutator.mutate(payload, {
      onSuccess: () => { toast.success(scheme ? 'Scheme updated' : 'Scheme created'); onClose(); },
      onError: (e) => toast.error(e.message),
    });
  });
  const isPending = create.isPending || update.isPending;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{scheme ? 'Edit scheme' : 'New scheme'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rewardSchemeImageUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="pointsThreshold" render={({ field }) => (
            <FormItem>
              <FormLabel>Points threshold</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="validFrom" render={({ field }) => (
            <FormItem>
              <FormLabel>Valid from</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="validUntil" render={({ field }) => (
            <FormItem>
              <FormLabel>Valid until</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

export function RewardSchemes() {
  const { data, isLoading, isError, error } = useRewardSchemes();
  const remove = useDeleteRewardScheme();
  const [editing, setEditing] = useState<RewardScheme | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reward schemes</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New scheme</Button>
          </DialogTrigger>
          {creating && <SchemeFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All schemes</CardTitle></CardHeader>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Points threshold</TableHead>
                  <TableHead>Valid from</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.pointsThreshold ?? 0}</TableCell>
                    <TableCell>{s.validFrom ?? '—'}</TableCell>
                    <TableCell>{s.validUntil ?? '—'}</TableCell>
                    <TableCell>{s.status ?? '—'}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove.mutate(
                          { _id: s._id },
                          {
                            onSuccess: () => toast.success('Scheme deleted'),
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <SchemeFormDialog scheme={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
