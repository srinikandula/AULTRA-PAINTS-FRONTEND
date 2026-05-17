import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useProductCategories } from './product-categories-hooks';
import {
  useCreateCatalog, useUpdateCatalog, useFocusProducts,
} from './hooks';
import type { CatalogItem } from './hooks';

const NONE = '__none__';

const VOLUMES = [
  '10ML', '20ML', '30ML', '50ML', '100ML', '200ML', '500ML',
  '1LT', '2LT', '4LT', '5LT', '10LT', '20LT',
  '1KG', '2KG', '5KG', '10KG', '20KG', '50KG',
] as const;

const volumeRowSchema = z.object({
  volume: z.string().min(1, 'Pick a volume'),
  price: z.coerce.number().positive('Must be > 0'),
});

const schema = z.object({
  productDescription: z.string().min(1, 'Required'),
  productStatus: z.enum(['Active', 'Inactive']),
  productCategory: z.string().optional(),
  focusProductId: z.string().min(1, 'Pick a focus product'),
  volumeRows: z.array(volumeRowSchema).min(1, 'Add at least one price row'),
});

type CatalogValues = z.infer<typeof schema>;

// TODO: geo-pricing -- replace the single "All" place per volume row with a
//   sub-table allowing one or more {place, price} pairs where place is "All"
//   or a state/zone/district. Currently hard-codes refId: "All" for every row.

// TODO: focusProductMapping -- Angular maps each volume to a focus-product id
//   based on the volume extracted from the focus-product's sName. v1 sends
//   null and relies on the backend's tolerance.

type CatalogFormProps = {
  initial?: CatalogItem;
};

function categoryIdOf(c: CatalogItem['productCategory']): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c._id ?? '';
}

// Group an existing catalog's stored price rows -- `{volume, refId, price}[]`
// -- back into the form's `volumeRows` shape. v1 only renders the
// `refId: "All"` entries; if a volume only has non-"All" entries, we fall
// back to the first row so we never drop the volume entirely.
function volumeRowsFromCatalog(
  price: CatalogItem['price'],
): Array<{ volume: string; price: number }> {
  if (!price?.length) return [];
  const byVolume = new Map<string, Array<{ refId: string; price: number }>>();
  for (const row of price) {
    if (!row.volume) continue;
    const arr = byVolume.get(row.volume) ?? [];
    arr.push({ refId: row.refId, price: row.price });
    byVolume.set(row.volume, arr);
  }
  const rows: Array<{ volume: string; price: number }> = [];
  for (const [volume, entries] of byVolume) {
    const allEntry = entries.find((e) => e.refId === 'All');
    const chosen = allEntry ?? entries[0];
    rows.push({ volume, price: chosen.price });
  }
  return rows;
}

export function CatalogForm({ initial }: CatalogFormProps) {
  const navigate = useNavigate();
  const isEdit = !!initial;
  const categories = useProductCategories();
  const focusProducts = useFocusProducts();
  const create = useCreateCatalog();
  const update = useUpdateCatalog();

  const [imageDataUri, setImageDataUri] = useState<string | null>(
    initial?.productOfferImageUrl ?? null,
  );

  const defaultRows = useMemo(() => {
    if (!initial) return [{ volume: '', price: 0 }];
    const rows = volumeRowsFromCatalog(initial.price);
    return rows.length > 0 ? rows : [{ volume: '', price: 0 }];
  }, [initial]);

  const form = useForm<CatalogValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productDescription: initial?.productOfferDescription ?? '',
      productStatus: initial?.productOfferStatus ?? 'Active',
      productCategory: categoryIdOf(initial?.productCategory) || NONE,
      focusProductId: initial?.focusProductId
        ? String(initial.focusProductId)
        : '',
      volumeRows: defaultRows,
    },
  });

  const rows = useFieldArray({ control: form.control, name: 'volumeRows' });
  const statusValue = form.watch('productStatus');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setImageDataUri(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const onSubmit = form.handleSubmit((values) => {
    const isNewImage = imageDataUri?.startsWith('data:') ?? false;
    if (!isEdit && !isNewImage) {
      toast.error('Image is required');
      return;
    }

    // v1: refId hard-coded to "All" for every entry. Geo-pricing is TODO.
    const price: Record<string, Array<Record<string, number>>> = {};
    for (const row of values.volumeRows) {
      if (!price[row.volume]) price[row.volume] = [];
      price[row.volume].push({ All: row.price });
    }

    const productCategory =
      values.productCategory && values.productCategory !== NONE
        ? values.productCategory
        : null;

    const basePayload = {
      productDescription: values.productDescription,
      productStatus: values.productStatus,
      productCategory,
      focusProductId: values.focusProductId,
      focusUnitId: 1,
      focusProductMapping: null,
      price: JSON.stringify(price),
    };

    const payload = isNewImage && imageDataUri
      ? { ...basePayload, productImage: imageDataUri }
      : basePayload;

    const mutator = (isEdit ? update : create) as unknown as {
      mutate: (
        body: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
      isPending: boolean;
    };
    const body = isEdit && initial ? { _id: initial._id, ...payload } : payload;

    mutator.mutate(body, {
      onSuccess: () => {
        toast.success(isEdit ? 'Product updated' : 'Product created');
        navigate('/product-catalog');
      },
      onError: (e) => toast.error(e.message),
    });
  });

  const isPending = create.isPending || update.isPending;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Catalog details' : 'New product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            {/* Image is held in local state (not RHF-managed) — render plain
                elements rather than FormItem/FormLabel/FormControl so we don't
                need a FormField context wrapper (which would throw at render). */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Image{isEdit ? '' : ' *'}
              </label>
              <Input type="file" accept="image/*" onChange={onFileChange} />
              {imageDataUri && (
                <img
                  src={imageDataUri}
                  alt="Preview"
                  className="mt-2 h-32 w-full max-w-xs rounded-md border object-cover"
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productStatus"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel className="text-sm">Active</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {statusValue === 'Active' ? 'Visible in the catalog' : 'Hidden from the catalog'}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === 'Active'}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? 'Active' : 'Inactive')
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value || NONE} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>No category</SelectItem>
                      {categories.data?.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="focusProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Focus product</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            focusProducts.isLoading
                              ? 'Loading...'
                              : 'Select a focus product'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {focusProducts.data?.map((fp) => (
                        <SelectItem key={fp.iMasterId} value={String(fp.iMasterId)}>
                          {fp.sName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Price by volume</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rows.append({ volume: '', price: 0 })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add row
                </Button>
              </div>
              {form.formState.errors.volumeRows?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.volumeRows.message}
                </p>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Volume</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="w-12 text-right">&nbsp;</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.fields.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`volumeRows.${idx}.volume`}
                            render={({ field }) => (
                              <FormItem>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Volume" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {VOLUMES.map((v) => (
                                      <SelectItem key={v} value={v}>{v}</SelectItem>
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
                            name={`volumeRows.${idx}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
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
                            aria-label="Delete row"
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
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
