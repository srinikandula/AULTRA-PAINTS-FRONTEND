import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useBrands } from '@/features/brands/hooks';
import { useUpdateProduct } from './hooks';
import type { Product } from '@/types/product';

const schema = z.object({
  brandId: z.string().min(1, 'Select a brand'),
  productName: z.string().min(1, 'Product name is required'),
});

type FormValues = z.infer<typeof schema>;

export function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const product = (location.state as { product?: Product } | null)?.product;

  const { data: brands, isLoading: brandsLoading } = useBrands();
  const update = useUpdateProduct();

  const brandId =
    product?.brand != null && typeof product.brand === 'object'
      ? (product.brand as { _id: string })._id
      : typeof product?.brand === 'string'
      ? product.brand
      : '';

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brandId,
      productName: product?.productName ?? '',
    },
  });

  if (!product) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          Product data not found. Go back to{' '}
          <button className="underline" onClick={() => navigate('/product-list')}>
            Products
          </button>{' '}
          and use the edit button there.
        </p>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    update.mutate(
      { _id: id!, ...values },
      {
        onSuccess: () => {
          toast.success('Product updated');
          navigate('/product-list');
        },
        onError: (e) => toast.error(e.message),
      },
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="brandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={brandsLoading ? 'Loading…' : 'Select a brand'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(brands ?? []).map((b) => (
                          <SelectItem key={b._id} value={b._id}>{b.brandName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Undercoat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? 'Saving…' : 'Save changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/product-list')}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
