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
  useProductOffers, useCreateProductOffer, useUpdateProductOffer, useDeleteProductOffer,
} from './hooks';
import type { ProductOffer } from '@/types/product-offer';

// TODO: applicableProductIds[] multi-select omitted for v1 — the plan flagged it as optional.

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  productOfferImageUrl: z.string().url('Must be a URL').optional().or(z.literal('')),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});
type OfferValues = z.infer<typeof offerSchema>;

function OfferFormDialog({ offer, onClose }: { offer?: ProductOffer; onClose: () => void }) {
  const create = useCreateProductOffer();
  const update = useUpdateProductOffer();
  const form = useForm<OfferValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: offer?.title ?? '',
      description: offer?.description ?? '',
      productOfferImageUrl: offer?.productOfferImageUrl ?? '',
      validFrom: offer?.validFrom ?? '',
      validUntil: offer?.validUntil ?? '',
    },
  });
  const onSubmit = form.handleSubmit((values) => {
    const mutator = (offer ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const payload = offer ? { _id: offer._id, ...values } : values;
    mutator.mutate(payload, {
      onSuccess: () => { toast.success(offer ? 'Offer updated' : 'Offer created'); onClose(); },
      onError: (e) => toast.error(e.message),
    });
  });
  const isPending = create.isPending || update.isPending;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{offer ? 'Edit offer' : 'New offer'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
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
          <FormField control={form.control} name="productOfferImageUrl" render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl><Input {...field} /></FormControl>
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

export function ProductOffers() {
  const { data, isLoading, isError, error } = useProductOffers();
  const remove = useDeleteProductOffer();
  const [editing, setEditing] = useState<ProductOffer | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Product offers</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New offer</Button>
          </DialogTrigger>
          {creating && <OfferFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All offers</CardTitle></CardHeader>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Valid from</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell>{o.title}</TableCell>
                    <TableCell>{o.validFrom ?? '—'}</TableCell>
                    <TableCell>{o.validUntil ?? '—'}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(o)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove.mutate(
                          { _id: o._id },
                          {
                            onSuccess: () => toast.success('Offer deleted'),
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
        {editing && <OfferFormDialog offer={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
