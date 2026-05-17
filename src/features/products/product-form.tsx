import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useBrands } from '@/features/brands/hooks';
import { useProductCategories } from './product-categories-hooks';
import { useCreateProduct, useUpdateProduct } from './hooks';
import type { Product } from '@/types/product';

const productSchema = z.object({
  productName: z.string().min(1, 'Required'),
  productCode: z.string().min(1, 'Required'),
  brand: z.string().min(1, 'Required'),         // brand _id
  category: z.string().min(1, 'Required'),      // category _id
  price: z.coerce.number().nonnegative().optional(),
  redeemPoints: z.coerce.number().int().nonnegative().optional(),
  cashback: z.coerce.number().nonnegative().optional(),
  description: z.string().optional(),
});
type ProductValues = z.infer<typeof productSchema>;

export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const brands = useBrands();
  const categories = useProductCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const initialBrandId = typeof product?.brand === 'string' ? product.brand : product?.brand?._id ?? '';
  const initialCategoryId = typeof product?.category === 'string' ? product.category : product?.category?._id ?? '';

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: product?.productName ?? '',
      productCode: product?.productCode ?? '',
      brand: initialBrandId,
      category: initialCategoryId,
      price: product?.price ?? undefined,
      redeemPoints: product?.redeemPoints ?? undefined,
      cashback: product?.cashback ?? undefined,
      description: product?.description ?? '',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const handlers = {
      onSuccess: () => { toast.success(product ? 'Product updated' : 'Product created'); navigate('/product-list'); },
      onError: (e: Error) => toast.error(e.message),
    };
    if (product) {
      update.mutate({ _id: product._id, ...values }, handlers);
    } else {
      create.mutate(values, handlers);
    }
  });

  const isPending = create.isPending || update.isPending;

  return (
    <Card className="max-w-3xl">
      <CardHeader><CardTitle>{product ? 'Edit product' : 'New product'}</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="productCode" render={({ field }) => (
                <FormItem><FormLabel>Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="productName" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pick a brand" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {brands.data?.map((b) => <SelectItem key={b._id} value={b._id}>{b.brandName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.data?.map((c) => <SelectItem key={c._id} value={c._id}>{c.categoryName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="redeemPoints" render={({ field }) => (
                <FormItem><FormLabel>Redeem points</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cashback" render={({ field }) => (
                <FormItem><FormLabel>Cashback</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
