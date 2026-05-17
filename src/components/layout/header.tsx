import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const { accountType, logout } = useAuthStore();
  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  return (
    <header className="flex h-14 items-center justify-between bg-sidebar px-6 text-sidebar-foreground">
      <div className="text-lg font-semibold">Aultra Paints</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-sidebar-foreground/80">{accountType ?? 'User'}</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-sidebar-foreground/20 text-sidebar-foreground">
            {(accountType ?? 'U').slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </header>
  );
}
