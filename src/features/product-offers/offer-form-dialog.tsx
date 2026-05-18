import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useCreateProductOffer, useUpdateProductOffer } from './hooks';
import { useProductCategories } from '@/features/products/product-categories-hooks';
import { compressImage } from '@/lib/compress-image';
import { cacheBust } from '@/lib/cache-bust';
import type { ProductOffer } from '@/types/product-offer';

const NONE = '__none__';

const schema = z.object({
  productOfferDescription: z.string().min(1, 'Required'),
  cashback: z.coerce.number().nonnegative(),
  redeemPoints: z.coerce.number().int().nonnegative(),
  validUntil: z.string().optional(),
  productCategory: z.string().optional(),
  productOfferStatus: z.enum(['Active', 'Inactive']),
});
type OfferValues = z.infer<typeof schema>;

function categoryId(c: ProductOffer['productCategory']): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c._id ?? '';
}

export function OfferFormDialog({
  offer,
  onClose,
}: {
  offer?: ProductOffer;
  onClose: () => void;
}) {
  const create = useCreateProductOffer();
  const update = useUpdateProductOffer();
  const categoriesQuery = useProductCategories();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(
    cacheBust(offer?.productOfferImageUrl, offer?.updatedAt),
  );
  const hasNewImage = imageDataUri?.startsWith('data:') ?? false;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<OfferValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productOfferDescription: offer?.productOfferDescription ?? '',
      cashback: offer?.cashback ?? 0,
      redeemPoints: offer?.redeemPoints ?? 0,
      validUntil: offer?.validUntil ? offer.validUntil.slice(0, 10) : '',
      productCategory: categoryId(offer?.productCategory) || NONE,
      productOfferStatus: offer?.productOfferStatus ?? 'Active',
    },
  });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Downscale + JPEG-encode so the base64 payload fits under the
      // backend's bodyParser.json() default 100KB limit.
      const compressed = await compressImage(file);
      setImageDataUri(compressed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read image');
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    const isNewImage = imageDataUri?.startsWith('data:') ?? false;
    if (!offer && !isNewImage) {
      setSubmitError('Image is required');
      return;
    }
    const mutator = (offer ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const productCategory =
      values.productCategory && values.productCategory !== NONE
        ? values.productCategory
        : null;
    // TODO: implement geo-pricing (state/zone/district)
    const basePayload = {
      productOfferDescription: values.productOfferDescription,
      cashback: values.cashback,
      redeemPoints: values.redeemPoints,
      validUntil: values.validUntil || undefined,
      productCategory,
      productOfferStatus: values.productOfferStatus,
      price: [] as Array<{ refId: string; price: number }>,
    };
    const payload = offer
      ? {
          _id: offer._id,
          ...basePayload,
          ...(isNewImage && imageDataUri ? { productOfferImage: imageDataUri } : {}),
        }
      : {
          ...basePayload,
          productOfferImage: imageDataUri,
        };
    mutator.mutate(payload, {
      onSuccess: () => {
        toast.success(offer ? 'Offer updated' : 'Offer created');
        onClose();
      },
      onError: (e) => {
        // Surface inline (persistent) AND in a toast (peripheral), so the
        // user sees the reason even after the toast fades. The api() wrapper
        // already extracts {message} or {error} from the backend response
        // and falls back to a friendly string for 413 / 5xx.
        setSubmitError(e.message);
        toast.error(e.message);
      },
    });
  });

  const isPending = create.isPending || update.isPending;
  const statusValue = form.watch('productOfferStatus');

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{offer ? 'Edit offer' : 'New offer'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          {submitError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {submitError}
            </div>
          )}
          {/* Image is held in local state (not RHF-managed) — render plain
              elements rather than FormItem/FormLabel/FormControl so we don't
              need a FormField context wrapper. */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Image{offer ? '' : ' *'}
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
                  className="h-32 w-full rounded-md border object-cover"
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
                  {hasNewImage && offer && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageDataUri(cacheBust(offer.productOfferImageUrl, offer.updatedAt));
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
            name="productOfferDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title / description</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || NONE}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>No category</SelectItem>
                    {categoriesQuery.data?.map((c) => (
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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="cashback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cashback</FormLabel>
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
            <FormField
              control={form.control}
              name="redeemPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redeem points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
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
          </div>

          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid until</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productOfferStatus"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <div>
                  <FormLabel className="text-sm">Active</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {statusValue === 'Active' ? 'Visible to users' : 'Hidden from users'}
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
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
