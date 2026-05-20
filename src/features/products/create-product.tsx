import { useNavigate } from 'react-router-dom';
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
import { useCreateProduct } from './hooks';

const schema = z.object({
  brandId: z.string().min(1, 'Select a brand'),
  productName: z.string().min(1, 'Product name is required'),
});

type FormValues = z.infer<typeof schema>;

export function CreateProduct() {
  const navigate = useNavigate();
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const create = useCreateProduct();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { brandId: '', productName: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Product created');
        navigate('/product-list');
      },
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New product</h1>
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
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Saving…' : 'Create product'}
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
