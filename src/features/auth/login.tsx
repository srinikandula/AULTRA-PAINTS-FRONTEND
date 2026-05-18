import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useSendOtp, useVerifyOtp } from './hooks';
import logoUrl from '@/assets/Aultrapaints_logo.png';

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Soft brand-tinted background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Brand logo above the card */}
          <div className="mb-6 flex flex-col items-center">
            <img
              src={logoUrl}
              alt="Aultra Paints"
              className="h-32 w-auto drop-shadow-sm"
            />
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border/60 bg-card/95 p-8 shadow-xl shadow-primary/5 backdrop-blur">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {step === 'mobile' ? 'Welcome back' : 'Enter the code'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {step === 'mobile'
                  ? 'Sign in with your registered mobile number'
                  : `We sent an OTP to ${mobile}`}
              </p>
            </div>

            {step === 'mobile' ? (
              <Form key="mobile-form" {...mobileForm}>
                <form className="space-y-4" onSubmit={onSendOtp}>
                  <FormField control={mobileForm.control} name="mobile" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9xxxxxxxxx"
                          inputMode="numeric"
                          maxLength={10}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button
                    type="submit"
                    className="h-11 w-full text-base"
                    disabled={sendOtp.isPending}
                  >
                    {sendOtp.isPending ? 'Sending…' : 'Send OTP'}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form key="otp-form" {...otpForm}>
                <form className="space-y-4" onSubmit={onVerifyOtp}>
                  <FormField control={otpForm.control} name="otp" render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-time password</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="6-digit code"
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="one-time-code"
                          autoFocus
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button
                    type="submit"
                    className="h-11 w-full text-base"
                    disabled={verifyOtp.isPending}
                  >
                    {verifyOtp.isPending ? 'Verifying…' : 'Verify & sign in'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep('mobile')}
                    className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Use a different number
                  </button>
                </form>
              </Form>
            )}
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link
              to="/privacy-policy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
