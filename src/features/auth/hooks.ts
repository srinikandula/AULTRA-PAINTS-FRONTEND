import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore, type AccountType } from '@/stores/auth-store';

type SendOtpRes = { message: string };

export function useSendOtp() {
  return useMutation<SendOtpRes, Error, { mobile: string }>({
    mutationFn: (body) =>
      api<SendOtpRes>('auth/loginWithOTP', { method: 'POST', body, skipAuth: true }),
  });
}

// Shape returned by the backend's /auth/verifyOTP and /auth/login handlers.
// The JWT only carries {name, mobile, email, _id}; accountType + id are
// top-level fields on the response body.
type VerifyOtpRes = {
  status: number;
  token: string;
  accountType: AccountType;
  id: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  message?: string;
};

export function useVerifyOtp() {
  const login = useAuthStore((s) => s.login);
  return useMutation<VerifyOtpRes, Error, { mobile: string; otp: string }>({
    mutationFn: async (body) => {
      const res = await api<VerifyOtpRes>('auth/verifyOTP', {
        method: 'POST',
        body,
        skipAuth: true,
      });
      login({ token: res.token, accountType: res.accountType, userId: res.id });
      return res;
    },
  });
}

export function useRegister() {
  return useMutation<{ message: string }, Error, { name: string; mobile: string; email?: string }>({
    mutationFn: (body) => api<{ message: string }>('auth/register', { method: 'POST', body, skipAuth: true }),
  });
}
