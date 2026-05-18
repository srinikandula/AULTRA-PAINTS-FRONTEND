import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRegister } from './hooks';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  mobile: z.string().regex(/^\d{10}$/, '10 digits required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});
type Values = z.infer<typeof schema>;

export function Register() {
  const navigate = useNavigate();
  const register = useRegister();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', mobile: '', email: '' },
  });
  const onSubmit = form.handleSubmit((values) => {
    register.mutate(
      { name: values.name, mobile: values.mobile, email: values.email || undefined },
      {
        onSuccess: () => { toast.success('Registered — please log in'); navigate('/login'); },
        onError: (e) => toast.error(e.message),
      },
    );
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Create an Aultra Paints account</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={onSubmit}>
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={10} placeholder="9xxxxxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={register.isPending}>
                {register.isPending ? 'Submitting…' : 'Register'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
