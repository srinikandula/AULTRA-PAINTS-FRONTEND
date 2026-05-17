import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

type SendOtpRes = { message: string };

export function useSendOtp() {
  return useMutation<SendOtpRes, Error, { mobile: string }>({
    mutationFn: (body) =>
      api<SendOtpRes>('auth/loginWithOTP', { method: 'POST', body, skipAuth: true }),
  });
}

type VerifyOtpRes = { token: string };

export function useVerifyOtp() {
  const login = useAuthStore((s) => s.login);
  return useMutation<VerifyOtpRes, Error, { mobile: string; otp: string }>({
    mutationFn: async (body) => {
      const res = await api<VerifyOtpRes>('auth/verifyOTP', {
        method: 'POST',
        body,
        skipAuth: true,
      });
      login(res.token);
      return res;
    },
  });
}

export function useRegister() {
  return useMutation<{ message: string }, Error, { name: string; mobile: string; email?: string }>({
    mutationFn: (body) => api<{ message: string }>('auth/register', { method: 'POST', body, skipAuth: true }),
  });
}
