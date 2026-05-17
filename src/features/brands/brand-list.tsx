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
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from './hooks';
import type { Brand } from '@/types/brand';

const brandSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
});
type BrandValues = z.infer<typeof brandSchema>;

function BrandFormDialog({ brand, onClose }: { brand?: Brand; onClose: () => void }) {
  const create = useCreateBrand();
  const update = useUpdateBrand();
  const form = useForm<BrandValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { brandName: brand?.brandName ?? '', description: brand?.description ?? '' },
  });
  const onSubmit = form.handleSubmit((values) => {
    const mutator = (brand ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const payload = brand ? { _id: brand._id, ...values } : values;
    mutator.mutate(payload, {
      onSuccess: () => { toast.success(brand ? 'Brand updated' : 'Brand created'); onClose(); },
      onError: (e) => toast.error(e.message),
    });
  });
  const isPending = create.isPending || update.isPending;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{brand ? 'Edit brand' : 'New brand'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField control={form.control} name="brandName" render={({ field }) => (
            <FormItem>
              <FormLabel>Brand name</FormLabel>
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

export function BrandList() {
  const { data, isLoading, isError, error } = useBrands();
  const remove = useDeleteBrand();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Brands</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New brand</Button>
          </DialogTrigger>
          {creating && <BrandFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All brands</CardTitle></CardHeader>
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
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>{b.brandName}</TableCell>
                    <TableCell>{b.description ?? '—'}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove.mutate(
                          { _id: b._id },
                          {
                            onSuccess: () => toast.success('Brand deleted'),
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
        {editing && <BrandFormDialog brand={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
