import { useState } from 'react';
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
import { useSendOtp, useVerifyOtp } from './hooks';

const mobileSchema = z.object({ mobile: z.string().regex(/^\d{10}$/, '10 digits required') });
const otpSchema = z.object({ otp: z.string().regex(/^\d{4,6}$/, 'Enter the OTP') });

type Step = 'mobile' | 'otp';

export function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const mobileForm = useForm<z.infer<typeof mobileSchema>>({
    resolver: zodResolver(mobileSchema),
    defaultValues: { mobile: '' },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const onSendOtp = mobileForm.handleSubmit((values) => {
    sendOtp.mutate(values, {
      onSuccess: () => {
        setMobile(values.mobile);
        setStep('otp');
        toast.success('OTP sent');
      },
      onError: (e) => toast.error(e.message),
    });
  });

  const onVerifyOtp = otpForm.handleSubmit((values) => {
    verifyOtp.mutate({ mobile, otp: values.otp }, {
      onSuccess: () => navigate('/', { replace: true }),
      onError: (e) => toast.error(e.message),
    });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Aultra Paints</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'mobile' ? (
            <Form {...mobileForm}>
              <form className="space-y-4" onSubmit={onSendOtp}>
                <FormField control={mobileForm.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="9xxxxxxxxx"
                        inputMode="numeric"
                        maxLength={10}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={sendOtp.isPending}>
                  {sendOtp.isPending ? 'Sending…' : 'Send OTP'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form className="space-y-4" onSubmit={onVerifyOtp}>
                <p className="text-sm text-muted-foreground">
                  OTP sent to <span className="font-medium">{mobile}</span>.
                  <button type="button" onClick={() => setStep('mobile')} className="ml-2 underline">
                    Change
                  </button>
                </p>
                <FormField control={otpForm.control} name="otp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter OTP"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={verifyOtp.isPending}>
                  {verifyOtp.isPending ? 'Verifying…' : 'Verify & sign in'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
