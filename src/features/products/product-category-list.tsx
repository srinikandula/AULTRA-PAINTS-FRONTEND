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
  useProductCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
} from './product-categories-hooks';
import type { ProductCategory } from '@/types/product-category';

const categorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});
type CategoryValues = z.infer<typeof categorySchema>;

function CategoryFormDialog({ category, onClose }: { category?: ProductCategory; onClose: () => void }) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { categoryName: category?.categoryName ?? '', description: category?.description ?? '' },
  });
  const onSubmit = form.handleSubmit((values) => {
    const mutator = (category ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const payload = category ? { _id: category._id, ...values } : values;
    mutator.mutate(payload, {
      onSuccess: () => { toast.success(category ? 'Category updated' : 'Category created'); onClose(); },
      onError: (e) => toast.error(e.message),
    });
  });
  const isPending = create.isPending || update.isPending;
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField control={form.control} name="categoryName" render={({ field }) => (
            <FormItem>
              <FormLabel>Category name</FormLabel>
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

export function ProductCategoryList() {
  const { data, isLoading, isError, error } = useProductCategories();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Product categories</h1>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New category</Button>
          </DialogTrigger>
          {creating && <CategoryFormDialog onClose={() => setCreating(false)} />}
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All categories</CardTitle></CardHeader>
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
                {data?.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.categoryName}</TableCell>
                    <TableCell>{c.description ?? '—'}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove.mutate(
                          { _id: c._id },
                          {
                            onSuccess: () => toast.success('Category deleted'),
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
        {editing && <CategoryFormDialog category={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </div>
  );
}
