import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTokenExpired } from '@/lib/auth';

export type AccountType = 'SuperUser' | 'SalesExecutive' | 'Dealer' | 'Painter' | 'ProductionManager';

type LoginInput = { token: string; accountType: AccountType; userId: string };

type AuthState = {
  token: string | null;
  accountType: AccountType | null;
  userId: string | null;
  isAuthenticated: () => boolean;
  login: (input: LoginInput) => void;
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
      // `accountType` and `userId` are read from the verifyOTP / login response
      // body — the backend's JWT payload only contains `{name, mobile, email, _id}`
      // and intentionally does NOT carry the role, so we cannot derive it from
      // the token alone.
      login: ({ token, accountType, userId }) => {
        set({ token, accountType, userId });
      },
      logout: () => set({ token: null, accountType: null, userId: null }),
    }),
    {
      name: STORAGE_KEY,
      // Persist token + the derived auth context so a page refresh keeps the
      // user signed in (we can't re-derive accountType from the JWT on reload).
      partialize: (state) => ({
        token: state.token,
        accountType: state.accountType,
        userId: state.userId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && isTokenExpired(state.token)) {
          state.logout();
        }
      },
    },
  ),
);
