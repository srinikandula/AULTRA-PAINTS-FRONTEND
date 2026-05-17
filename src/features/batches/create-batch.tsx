import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useProducts } from '@/features/products/hooks';
import { useCreateBatch } from './hooks';

const schema = z.object({
  batchNumber: z.string().min(1),
  product: z.string().min(1),
  manufacturedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  couponSeriesStart: z.coerce.number().int().nonnegative(),
  couponSeriesEnd: z.coerce.number().int().nonnegative(),
});
type Values = z.infer<typeof schema>;

export function CreateBatch() {
  const navigate = useNavigate();
  const products = useProducts({ page: 1, limit: 200 });
  const create = useCreateBatch();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { batchNumber: '', product: '', quantity: 0, couponSeriesStart: 0, couponSeriesEnd: 0 },
  });
  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () => { toast.success('Batch created'); navigate('/batch-list'); },
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New batch</h1>
      <Card className="max-w-3xl">
        <CardHeader><CardTitle>Batch details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="batchNumber" render={({ field }) => (
                  <FormItem><FormLabel>Batch number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="product" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pick a product" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {products.data?.data.map((p) => (
                          <SelectItem key={p._id} value={p._id}>{p.productName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="manufacturedDate" render={({ field }) => (
                  <FormItem><FormLabel>Manufactured date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expiryDate" render={({ field }) => (
                  <FormItem><FormLabel>Expiry date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="couponSeriesStart" render={({ field }) => (
                  <FormItem><FormLabel>Coupon series start</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="couponSeriesEnd" render={({ field }) => (
                  <FormItem><FormLabel>Coupon series end</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
