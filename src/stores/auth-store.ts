import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwt, isTokenExpired } from '@/lib/auth';

export type AccountType = 'SuperUser' | 'SalesExecutive' | 'Dealer' | 'Painter';

type AuthState = {
  token: string | null;
  accountType: AccountType | null;
  userId: string | null;
  isAuthenticated: () => boolean;
  login: (token: string) => void;
  logout: () => void;
};

// Same localStorage key the Angular app used so a half-migrated user keeps
// their session across the cutover.
const STORAGE_KEY = 'authToken';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      accountType: null,
      userId: null,
      isAuthenticated: () => {
        const t = get().token;
        return !!t && !isTokenExpired(t);
      },
      login: (token) => {
        const payload = decodeJwt(token);
        set({
          token,
          accountType: (payload?.accountType as AccountType | undefined) ?? null,
          userId: (payload?._id as string | undefined) ?? null,
        });
      },
      logout: () => set({ token: null, accountType: null, userId: null }),
    }),
    {
      name: STORAGE_KEY,
      // Persist only the token; rehydrate the rest from it on load.
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          if (isTokenExpired(state.token)) {
            state.logout();
            return;
          }
          const payload = decodeJwt(state.token);
          state.accountType = (payload?.accountType as AccountType | undefined) ?? null;
          state.userId = (payload?._id as string | undefined) ?? null;
        }
      },
    },
  ),
);
