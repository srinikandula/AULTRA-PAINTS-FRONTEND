import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateUser, useUpdateUser } from './hooks';
import type { User, UserAccountType } from '@/types/user';

const ACCOUNT_TYPES: UserAccountType[] = [
  'Painter', 'Contractor', 'Dealer', 'SuperUser', 'SalesExecutive',
];

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(/^\d{10}$/, '10 digits required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  accountType: z.enum(['Painter', 'Contractor', 'Dealer', 'SuperUser', 'SalesExecutive']),
  dealerCode: z.string().optional(),
  parentDealerCode: z.string().optional(),
  parentSalesExecutive: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  district: z.string().optional(),
});
type UserValues = z.infer<typeof userSchema>;

export type UserFormDialogProps = {
  user?: User;
  onClose: () => void;
};

export function UserFormDialog({ user, onClose }: UserFormDialogProps) {
  const create = useCreateUser();
  const update = useUpdateUser();
  const isEdit = !!user;

  const form = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name ?? '',
      mobile: user?.mobile ?? '',
      email: user?.email ?? '',
      accountType: user?.accountType ?? 'Painter',
      dealerCode: user?.dealerCode ?? '',
      parentDealerCode: user?.parentDealerCode ?? '',
      parentSalesExecutive: user?.parentSalesExecutive ?? '',
      address: user?.address ?? '',
      state: user?.state ?? '',
      zone: user?.zone ?? '',
      district: user?.district ?? '',
    },
  });

  const accountType = form.watch('accountType');

  const onSubmit = form.handleSubmit((values) => {
    // Trim empty optional strings so we don't push '' to the backend.
    const cleaned: Partial<User> = {
      name: values.name,
      mobile: values.mobile,
      accountType: values.accountType,
    };
    if (values.email) cleaned.email = values.email;
    if (values.accountType === 'Dealer') {
      if (values.dealerCode) cleaned.dealerCode = values.dealerCode;
      if (values.address) cleaned.address = values.address;
      if (values.state) cleaned.state = values.state;
      if (values.zone) cleaned.zone = values.zone;
      if (values.district) cleaned.district = values.district;
      // TODO: productCategories multi-select (depends on /productCategories/all).
    }
    if (values.accountType === 'Painter') {
      if (values.parentDealerCode) cleaned.parentDealerCode = values.parentDealerCode;
      // TODO: sales-executive-assignment is a separate dependency.
    }
    if (values.accountType === 'SalesExecutive') {
      if (values.parentSalesExecutive) cleaned.parentSalesExecutive = values.parentSalesExecutive;
    }

    const mutator = (isEdit ? update : create) as unknown as {
      mutate: (
        payload: unknown,
        opts: { onSuccess: () => void; onError: (e: Error) => void },
      ) => void;
    };
    const payload = isEdit ? { _id: user._id, ...cleaned } : cleaned;
    mutator.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? 'User updated' : 'User created');
        onClose();
      },
      onError: (e) => toast.error(e.message),
    });
  });

  const isPending = create.isPending || update.isPending;

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="mobile" render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile</FormLabel>
              <FormControl>
                <Input {...field} readOnly={isEdit} disabled={isEdit} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="accountType" render={({ field }) => (
            <FormItem>
              <FormLabel>Account type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {accountType === 'Dealer' && (
            <>
              <FormField control={form.control} name="dealerCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealer code</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="zone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="district" render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </>
          )}

          {accountType === 'Painter' && (
            <FormField control={form.control} name="parentDealerCode" render={({ field }) => (
              <FormItem>
                <FormLabel>Parent dealer code</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          {accountType === 'SalesExecutive' && (
            <FormField control={form.control} name="parentSalesExecutive" render={({ field }) => (
              <FormItem>
                <FormLabel>Parent sales executive</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
