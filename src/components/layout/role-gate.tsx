import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type AccountType } from '@/stores/auth-store';

type RoleGateProps = {
  roles: AccountType[];
};

export function RoleGate({ roles }: RoleGateProps) {
  const accountType = useAuthStore((s) => s.accountType);
  if (!accountType || !roles.includes(accountType)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
