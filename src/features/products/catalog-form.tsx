import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, ImagePlus, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useProductCategories } from './product-categories-hooks';
import {
  useCreateCatalog, useUpdateCatalog, useFocusProducts, useSyncProductPrices,
} from './hooks';
import { compressImage } from '@/lib/compress-image';
import { cacheBust } from '@/lib/cache-bust';
import type { CatalogItem, FocusProduct } from './hooks';

const NONE = '__none__';

// Extracts the volume token from a Focus8 product name.
// Handles both joined ("20LTR") and space-separated ("20 LTR") formats.
// e.g. "1LT Undercoat" → "1LT", "AULTRA PRIMER 20 LTRS" → "20LTRS", "500ML Primer" → "500ML"
function extractVolume(sName: string): string {
  const match = sName.match(/\b(\d+(?:\.\d+)?)\s*(LTRS|LTR|LT|ML|KGS|KG|G|L)\b/i);
  return match ? `${match[1]}${match[2].toUpperCase()}` : '';
}

function stripVolume(sName: string): string {
  return sName.replace(/\b\d+(?:\.\d+)?\s*(?:LTRS|LTR|LT|ML|KGS|KG|G|L)\b/gi, '').replace(/\s+/g, ' ').trim();
}

type FocusProductComboboxProps = {
  value: string;
  onChange: (value: string, fp: FocusProduct | undefined) => void;
  focusProducts: FocusProduct[] | undefined;
  isLoading: boolean;
};

function FocusProductCombobox({ value, onChange, focusProducts, isLoading }: FocusProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!focusProducts) return [];
    const q = search.toLowerCase();
    return q ? focusProducts.filter((fp) => fp.sName.toLowerCase().includes(q)) : focusProducts;
  }, [focusProducts, search]);

  const selectedName = useMemo(
    () => focusProducts?.find((fp) => String(fp.iMasterId) === value)?.sName ?? null,
    [value, focusProducts],
  );

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">
            {selectedName ?? (isLoading ? 'Loading…' : 'Select focus product')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-2" align="start">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8"
          autoFocus
        />
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">No results</p>
          ) : (
            filtered.map((fp) => {
              const id = String(fp.iMasterId);
              const selected = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                    selected && 'bg-accent',
                  )}
                  onClick={() => {
                    onChange(id, fp);
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mt-0.5 h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-left">{fp.sName}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type AddFocusProductsButtonProps = {
  focusProducts: FocusProduct[] | undefined;
  isLoading: boolean;
  onAdd: (fps: FocusProduct[]) => void;
};

function AddFocusProductsButton({ focusProducts, isLoading, onAdd }: AddFocusProductsButtonProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!focusProducts) return [];
    const q = search.toLowerCase();
    return q ? focusProducts.filter((fp) => fp.sName.toLowerCase().includes(q)) : focusProducts;
  }, [focusProducts, search]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const reset = () => { setSearch(''); setSelected(new Set()); };

  const handleAdd = () => {
    const fps = (focusProducts ?? []).filter((fp) => selected.has(String(fp.iMasterId)));
    onAdd(fps);
    reset();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add focus products
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-2" align="end">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8"
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="py-2 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-2 text-center text-sm text-muted-foreground">No results</p>
          ) : (
            filtered.map((fp) => {
              const id = String(fp.iMasterId);
              const checked = selected.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                    checked && 'bg-accent/60',
                  )}
                  onClick={() => toggle(id)}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      checked ? 'bg-primary border-primary' : 'border-input',
                    )}
                  >
                    {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-left">{fp.sName}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="mt-2 border-t pt-2">
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={selected.size === 0}
            onClick={handleAdd}
          >
            {selected.size > 0
              ? `Add ${selected.size} product${selected.size !== 1 ? 's' : ''}`
              : 'Select products above'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const volumeRowSchema = z.object({
  volume: z.string().min(1, 'Volume is required'),
  focusProductId: z.string().min(1, 'Pick a focus product'),
});

const schema = z.object({
  productDescription: z.string().min(1, 'Required'),
  productStatus: z.enum(['Active', 'Inactive']),
  productCategory: z.string().optional(),
  volumeRows: z.array(volumeRowSchema).min(1, 'Add at least one volume'),
});

type CatalogValues = z.infer<typeof schema>;

type CatalogFormProps = {
  initial?: CatalogItem;
};

function categoryIdOf(c: CatalogItem['productCategory']): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c._id ?? '';
}

function defaultRowsFromCatalog(item: CatalogItem): Array<{ volume: string; focusProductId: string }> {
  // Prefer the explicit per-volume mapping (v2 products)
  if (item.focusProductMapping?.length) {
    return item.focusProductMapping.map((m) => ({
      volume: m.volume,
      focusProductId: String(m.focusProductId),
    }));
  }
  // Backward compat: v1 product with a single focusProductId — derive rows from stored price volumes
  const volumes = [...new Set((item.price ?? []).map((p) => p.volume).filter(Boolean))];
  if (volumes.length > 0) {
    return volumes.map((v) => ({
      volume: v,
      focusProductId: item.focusProductId ? String(item.focusProductId) : '',
    }));
  }
  return [{ volume: '', focusProductId: '' }];
}

export function CatalogForm({ initial }: CatalogFormProps) {
  const navigate = useNavigate();
  const isEdit = !!initial;
  const categories = useProductCategories();
  const focusProducts = useFocusProducts();
  const create = useCreateCatalog();
  const update = useUpdateCatalog();
  const syncPrices = useSyncProductPrices();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(
    cacheBust(initial?.productOfferImageUrl, initial?.updatedAt),
  );
  const hasNewImage = imageDataUri?.startsWith('data:') ?? false;

  const defaultRows = useMemo(() => {
    if (!initial) return [];
    const rows = defaultRowsFromCatalog(initial);
    return rows.length > 0 ? rows : [];
  }, [initial]);

  const form = useForm<CatalogValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productDescription: initial?.productOfferDescription ?? '',
      productStatus: initial?.productOfferStatus ?? 'Active',
      productCategory: categoryIdOf(initial?.productCategory) || NONE,
      volumeRows: defaultRows,
    },
  });

  const rows = useFieldArray({ control: form.control, name: 'volumeRows' });
  const statusValue = form.watch('productStatus');

  const onAddFocusProducts = (fps: FocusProduct[]) => {
    fps.forEach((fp) => {
      rows.append({ focusProductId: String(fp.iMasterId), volume: extractVolume(fp.sName) });
    });
    // Auto-fill description from first selected product name (volume stripped) if still empty
    if (fps.length > 0 && !form.getValues('productDescription').trim()) {
      const derived = stripVolume(fps[0].sName);
      if (derived) form.setValue('productDescription', derived, { shouldValidate: true });
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImageDataUri(compressed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read image');
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    const isNewImage = imageDataUri?.startsWith('data:') ?? false;
    if (!isEdit && !isNewImage) {
      toast.error('Image is required');
      return;
    }

    const productCategory =
      values.productCategory && values.productCategory !== NONE
        ? values.productCategory
        : null;

    const focusProductMapping = JSON.stringify(
      values.volumeRows.map((r) => ({
        volume: r.volume,
        focusProductId: Number(r.focusProductId),
        focusUnitId: 1,
      })),
    );

    const basePayload = {
      productDescription: values.productDescription,
      productStatus: values.productStatus,
      productCategory,
      focusProductMapping,
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

  const onSyncPrices = () => {
    if (!initial) return;
    syncPrices.mutate(initial._id, {
      onSuccess: (data) =>
        toast.success(`Synced ${data.pricesSynced} price${data.pricesSynced !== 1 ? 's' : ''} from Focus8`),
      onError: (e) => toast.error(e.message),
    });
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Catalog details' : 'New product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            {/* Image — held in local state, not RHF-managed */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Image{isEdit ? '' : ' *'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
              {imageDataUri ? (
                <div className="space-y-2">
                  <img
                    src={imageDataUri}
                    alt="Preview"
                    className="h-32 w-full max-w-xs rounded-md border object-cover"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Replace image
                    </Button>
                    {hasNewImage && isEdit && initial && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageDataUri(cacheBust(initial.productOfferImageUrl, initial.updatedAt));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        Cancel change
                      </Button>
                    )}
                    {hasNewImage && (
                      <span className="text-xs text-muted-foreground">New image selected</span>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Choose image
                </Button>
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
                  <FormControl>
                    <Combobox
                      options={[
                        { value: NONE, label: 'No category' },
                        ...(categories.data ?? []).map((c) => ({
                          value: c._id,
                          label: c.categoryName,
                        })),
                      ]}
                      value={field.value || NONE}
                      onChange={field.onChange}
                      placeholder="Select a category"
                      searchPlaceholder="Search category..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Volumes — each row maps to one Focus8 product */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Volumes &amp; Focus products</h2>
                  <p className="text-xs text-muted-foreground">
                    Prices are fetched automatically from the Focus8 price book on save.
                  </p>
                </div>
                <AddFocusProductsButton
                  focusProducts={focusProducts.data}
                  isLoading={focusProducts.isLoading}
                  onAdd={onAddFocusProducts}
                />
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
                      <TableHead className="min-w-[200px]">Focus product</TableHead>
                      <TableHead className="min-w-[110px]">Volume</TableHead>
                      <TableHead className="w-12 text-right">&nbsp;</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.fields.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                          Use "Add focus products" to add volume rows.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.fields.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`volumeRows.${idx}.focusProductId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <FocusProductCombobox
                                    value={field.value}
                                    onChange={(val, fp) => {
                                      field.onChange(val);
                                      if (fp) {
                                        const v = extractVolume(fp.sName);
                                        if (v) {
                                          form.setValue(`volumeRows.${idx}.volume`, v, {
                                            shouldValidate: true,
                                          });
                                        }
                                      }
                                    }}
                                    focusProducts={focusProducts.data}
                                    isLoading={focusProducts.isLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`volumeRows.${idx}.volume`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="e.g. 1LT" {...field} />
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
                            variant="destructiveIcon"
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
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={syncPrices.isPending}
                  onClick={onSyncPrices}
                >
                  <RefreshCw className={`mr-2 h-4 w-4${syncPrices.isPending ? ' animate-spin' : ''}`} />
                  {syncPrices.isPending ? 'Syncing...' : 'Sync prices'}
                </Button>
              )}
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
