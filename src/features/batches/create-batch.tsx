import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useBrands } from '@/features/brands/hooks';
import { useCreateBatch, useProductsForBrand } from './hooks';

// Hard-coded list mirrors the Angular form. The branch column on the
// batchnumber document is a free string, but the original UI restricts the
// choice to these five plants, so we preserve that constraint here.
const BRANCHES = ['Dachepally', 'HayatNagar', 'Kukatpally', 'Pashamylaram', 'Vizag'] as const;
const VOLUMES = ['10 LT', '20 LT', '30 LT', '50 LT', '100 LT'] as const;

const detailSchema = z.object({
  CouponSeries: z.string().min(1, 'Required'),
  ProductName: z.string().min(1, 'Pick a product'),
  redeemablePoints: z.coerce.number().int().nonnegative(),
  value: z.coerce.number().nonnegative(),
  Volume: z.string().min(1, 'Pick a volume'),
  Quantity: z.coerce.number().int().positive('Must be > 0'),
});

const schema = z.object({
  Branch: z.string().min(1, 'Required'),
  Brand: z.string().min(1, 'Required'),
  CreationDate: z.string().min(1, 'Required'),
  ExpiryDate: z.string().min(1, 'Required'),
  BatchNumber: z.string().min(1, 'Required'),
  BatchNumbers: z.array(detailSchema).min(1, 'Add at least one row'),
});

type Values = z.infer<typeof schema>;

const emptyRow = {
  CouponSeries: '',
  ProductName: '',
  redeemablePoints: 0,
  value: 0,
  Volume: '',
  Quantity: 1,
};

export function CreateBatch() {
  const navigate = useNavigate();
  const brands = useBrands();
  const create = useCreateBatch();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      Branch: '',
      Brand: '',
      CreationDate: '',
      ExpiryDate: '',
      BatchNumber: '',
      BatchNumbers: [emptyRow],
    },
  });

  const rows = useFieldArray({ control: form.control, name: 'BatchNumbers' });

  const selectedBrandId = form.watch('Brand');
  const products = useProductsForBrand(selectedBrandId || undefined);

  // When the brand changes, clear every row's ProductName so a stale product
  // _id from the previously selected brand doesn't get submitted.
  useEffect(() => {
    const current = form.getValues('BatchNumbers');
    current.forEach((_, idx) => {
      form.setValue(`BatchNumbers.${idx}.ProductName`, '', { shouldDirty: false });
    });
    // We intentionally only react to brand changes; including `form` would
    // re-run on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrandId]);

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Batch created');
        navigate('/batch-list');
      },
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New batch</h1>
      <Card>
        <CardHeader><CardTitle>Batch details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="Branch" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pick a branch" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="Brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pick a brand" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {brands.data?.map((b) => (
                          <SelectItem key={b._id} value={b._id}>{b.brandName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="BatchNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="CreationDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creation date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ExpiryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Batch number details</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => rows.append(emptyRow)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add row
                  </Button>
                </div>
                {form.formState.errors.BatchNumbers?.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.BatchNumbers.message}
                  </p>
                )}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Product</TableHead>
                        <TableHead>Reward points</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Coupon series</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="w-12 text-right">&nbsp;</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.fields.map((row, idx) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`BatchNumbers.${idx}.ProductName`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={!selectedBrandId}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={selectedBrandId ? 'Pick a product' : 'Pick a brand first'}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {products.data?.map((p) => (
                                        <SelectItem key={p._id} value={p._id}>{p.products}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`BatchNumbers.${idx}.redeemablePoints`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input type="number" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`BatchNumbers.${idx}.value`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input type="number" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`BatchNumbers.${idx}.Volume`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Volume" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {VOLUMES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`BatchNumbers.${idx}.CouponSeries`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input inputMode="numeric" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`BatchNumbers.${idx}.Quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input type="number" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={rows.fields.length <= 1}
                              onClick={() => rows.remove(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
