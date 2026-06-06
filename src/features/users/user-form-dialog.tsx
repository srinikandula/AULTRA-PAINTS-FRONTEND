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
import { Combobox, MultiCombobox } from '@/components/ui/combobox';
import { useCreateUser, useUpdateUser, useSalesExecutives, useRoutes } from './hooks';
import { useProductCategories } from '@/features/products/product-categories-hooks';
import type { User, UserAccountType } from '@/types/user';

const ACCOUNT_TYPES: UserAccountType[] = [
  'Painter', 'Contractor', 'Dealer', 'SuperUser', 'SalesExecutive', 'ProductionManager',
];

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(/^\d{10}$/, '10 digits required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  accountType: z.enum(['Painter', 'Contractor', 'Dealer', 'SuperUser', 'SalesExecutive', 'ProductionManager']),
  dealerCode: z.string().optional(),
  parentDealerCode: z.string().optional(),
  parentSalesExecutive: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  district: z.string().optional(),
  primaryContactPerson: z.string().optional(),
  primaryContactPersonMobile: z.string().optional(),
  salesExecutive: z.string().optional(),
  routeName: z.string().optional(),
  productCategories: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (data.accountType !== 'Dealer') return;
  if (!data.primaryContactPerson?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['primaryContactPerson'] });
  }
  if (!data.primaryContactPersonMobile?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['primaryContactPersonMobile'] });
  } else if (!/^\d{10}$/.test(data.primaryContactPersonMobile)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '10 digits required', path: ['primaryContactPersonMobile'] });
  }
  if (!data.routeName?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['routeName'] });
  }
  if (!data.salesExecutive?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['salesExecutive'] });
  }
  if (!data.dealerCode?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['dealerCode'] });
  }
  if (!data.address?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Required', path: ['address'] });
  }
  if (!data.productCategories || data.productCategories.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one category', path: ['productCategories'] });
  }
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

  const salesExecsQuery = useSalesExecutives();
  const routesQuery = useRoutes();
  const categoriesQuery = useProductCategories();

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
      primaryContactPerson: user?.primaryContactPerson ?? '',
      primaryContactPersonMobile: user?.primaryContactPersonMobile ?? '',
      salesExecutive: user?.salesExecutive ?? '',
      routeName: user?.routeName ?? '',
      productCategories: user?.productCategories ?? [],
    },
  });

  const accountType = form.watch('accountType');

  const onSubmit = form.handleSubmit((values) => {
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
      cleaned.primaryContactPerson = values.primaryContactPerson;
      cleaned.primaryContactPersonMobile = values.primaryContactPersonMobile;
      cleaned.salesExecutive = values.salesExecutive;
      cleaned.routeName = values.routeName;
      cleaned.productCategories = values.productCategories;
    }
    if (values.accountType === 'Painter') {
      if (values.parentDealerCode) cleaned.parentDealerCode = values.parentDealerCode;
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
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-3" onSubmit={onSubmit}>

          {/* ── Always-visible base fields ── */}
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="mobile" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Mobile <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input className="h-8 text-sm" {...field} readOnly={isEdit} disabled={isEdit} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Email</FormLabel>
                <FormControl><Input className="h-8 text-sm" type="email" {...field} /></FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="accountType" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Account type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
          </div>

          {/* ── Dealer fields ── */}
          {accountType === 'Dealer' && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border/60 bg-muted/30 p-3">
              <FormField control={form.control} name="primaryContactPerson" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Primary Contact Person <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="primaryContactPersonMobile" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Primary Contact Mobile <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="dealerCode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Dealer code <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="salesExecutive" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Sales Executive <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Combobox
                      options={(salesExecsQuery.data ?? []).map((se) => ({
                        value: se.mobile,
                        label: se.name,
                        hint: se.mobile,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select SE"
                      searchPlaceholder="Search sales executive..."
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="routeName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Route <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Combobox
                      // No dedup: the same route name can belong to different
                      // salesmen, so the salesman name is shown as a hint to
                      // disambiguate.
                      options={(routesQuery.data ?? []).map((route) => ({
                        value: route.routeName,
                        label: route.routeName,
                        hint: route.salesmanName,
                        keywords: route.salesExecutiveMobile ?? '',
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select route"
                      searchPlaceholder="Search route..."
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-xs">Address <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">State</FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="zone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Zone</FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="district" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-xs">District</FormLabel>
                  <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="productCategories" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-xs">
                    Product Categories <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={(categoriesQuery.data ?? []).map((cat) => ({
                        value: cat._id,
                        label: cat.categoryName,
                      }))}
                      values={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Select categories"
                      searchPlaceholder="Search categories..."
                      emptyText="No categories"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          )}

          {/* ── Painter fields ── */}
          {accountType === 'Painter' && (
            <FormField control={form.control} name="parentDealerCode" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Parent dealer code</FormLabel>
                <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />
          )}

          {/* ── SalesExecutive fields ── */}
          {accountType === 'SalesExecutive' && (
            <FormField control={form.control} name="parentSalesExecutive" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Parent sales executive</FormLabel>
                <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                <FormMessage className="text-xs" />
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
