import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateDeal, useUpdateDeal } from './hooks';
import { useProductCategories } from '@/features/products/product-categories-hooks';
import { compressImage } from '@/lib/compress-image';
import { cacheBust } from '@/lib/cache-bust';
import type { Deal } from '@/types/deal';

const schema = z.object({
  title: z.string().min(1, 'Required').max(120, 'Max 120 chars'),
  description: z.string().max(1000, 'Max 1000 chars').optional(),
  expirationDate: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  active: z.boolean(),
});
type DealValues = z.infer<typeof schema>;

function categoryId(c: Deal['category'] | undefined): string {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c._id ?? '';
}

export function DealFormDialog({
  deal,
  onClose,
}: {
  deal?: Deal;
  onClose: () => void;
}) {
  const create = useCreateDeal();
  const update = useUpdateDeal();
  const categoriesQuery = useProductCategories();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(
    cacheBust(deal?.dealImageUrl, deal?.updatedAt),
  );
  const hasNewImage = imageDataUri?.startsWith('data:') ?? false;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<DealValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: deal?.title ?? '',
      description: deal?.description ?? '',
      expirationDate: deal?.expirationDate ? deal.expirationDate.slice(0, 10) : '',
      category: categoryId(deal?.category),
      active: deal?.active ?? true,
    },
  });

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
    setSubmitError(null);
    const isNewImage = imageDataUri?.startsWith('data:') ?? false;
    if (!deal && !isNewImage) {
      setSubmitError('Image is required');
      return;
    }
    const basePayload = {
      title: values.title,
      description: values.description || undefined,
      expirationDate: values.expirationDate,
      active: values.active,
      category: values.category,
    };
    if (deal) {
      update.mutate(
        {
          _id: deal._id,
          ...basePayload,
          ...(isNewImage && imageDataUri ? { dealImage: imageDataUri } : {}),
        },
        {
          onSuccess: () => { toast.success('Deal updated'); onClose(); },
          onError: (e) => { setSubmitError(e.message); toast.error(e.message); },
        },
      );
    } else {
      create.mutate(
        {
          ...basePayload,
          dealImage: imageDataUri ?? undefined,
        },
        {
          onSuccess: () => { toast.success('Deal created'); onClose(); },
          onError: (e) => { setSubmitError(e.message); toast.error(e.message); },
        },
      );
    }
  });

  const isPending = create.isPending || update.isPending;

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{deal ? 'Edit deal' : 'New deal'}</DialogTitle>
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

          {/* Image field — plain markup to avoid the FormField context requirement. */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Image{deal ? '' : ' *'}
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
                  {hasNewImage && deal && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageDataUri(cacheBust(deal.dealImageUrl, deal.updatedAt));
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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

          <FormField
            control={form.control}
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration date</FormLabel>
                <FormControl>
                  {/* On create: clamp to today or later (a past date would make
                      the deal invisible to dealers the moment it's saved).
                      On edit: leave unconstrained — admins may need to extend
                      an already-expired deal or audit historical entries. */}
                  <Input
                    type="date"
                    min={deal ? undefined : new Date().toISOString().slice(0, 10)}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <div>
                  <FormLabel className="text-sm">Active</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    {field.value ? 'Visible to dealers in the target category' : 'Hidden from dealers'}
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
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
