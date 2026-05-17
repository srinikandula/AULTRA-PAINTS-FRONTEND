import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useCreateRewardScheme, useUpdateRewardScheme } from './hooks';
import type { RewardScheme } from '@/types/reward-scheme';

const schema = z.object({
  rewardSchemeStatus: z.enum(['Active', 'Inactive']),
});
type SchemeValues = z.infer<typeof schema>;

export function SchemeFormDialog({
  scheme,
  onClose,
}: {
  scheme?: RewardScheme;
  onClose: () => void;
}) {
  const create = useCreateRewardScheme();
  const update = useUpdateRewardScheme();
  const [imageDataUri, setImageDataUri] = useState<string | null>(
    scheme?.rewardSchemeImageUrl ?? null,
  );

  const form = useForm<SchemeValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rewardSchemeStatus: scheme?.rewardSchemeStatus ?? 'Active',
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUri(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const onSubmit = form.handleSubmit((values) => {
    const isNewImage = imageDataUri?.startsWith('data:') ?? false;
    if (!scheme && !isNewImage) {
      toast.error('Image is required');
      return;
    }
    const mutator = (scheme ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const payload = scheme
      ? {
          _id: scheme._id,
          rewardSchemeStatus: values.rewardSchemeStatus,
          ...(isNewImage && imageDataUri ? { rewardSchemeImage: imageDataUri } : {}),
        }
      : {
          rewardSchemeStatus: values.rewardSchemeStatus,
          rewardSchemeImage: imageDataUri,
        };
    mutator.mutate(payload, {
      onSuccess: () => {
        toast.success(scheme ? 'Scheme updated' : 'Scheme created');
        onClose();
      },
      onError: (e) => toast.error(e.message),
    });
  });

  const isPending = create.isPending || update.isPending;
  const statusValue = form.watch('rewardSchemeStatus');

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{scheme ? 'Edit scheme' : 'New scheme'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          {/* Image is held in local state (not RHF-managed) — render plain
              elements rather than FormItem/FormLabel/FormControl so we don't
              need a FormField context wrapper. */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Image{scheme ? '' : ' *'}
            </label>
            <Input type="file" accept="image/*" onChange={onFileChange} />
            {imageDataUri && (
              <img
                src={imageDataUri}
                alt="Preview"
                className="mt-2 h-32 w-full rounded-md border object-cover"
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="rewardSchemeStatus"
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
