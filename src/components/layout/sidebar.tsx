import { NavLink } from 'react-router-dom';
import { useAuthStore, type AccountType } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, UserX, Boxes, Layers, Tag, ShoppingCart,
  Receipt, BookOpen, FileText, Percent, Gift, Wallet,
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AccountType[];
};

const NAV: NavItem[] = [
  { to: '/',                    label: 'Dashboard',         icon: LayoutDashboard, roles: ['SuperUser', 'SalesExecutive', 'Dealer', 'Painter'] },
  { to: '/users',               label: 'Users',             icon: Users,           roles: ['SuperUser'] },
  { to: '/unverified-users',    label: 'Unverified Users',  icon: UserX,           roles: ['SuperUser'] },
  { to: '/batch-list',          label: 'Batches',           icon: Boxes,           roles: ['SuperUser'] },
  { to: '/product-list',        label: 'Products',          icon: Layers,          roles: ['SuperUser'] },
  { to: '/product-category-list', label: 'Categories',      icon: Tag,             roles: ['SuperUser'] },
  { to: '/brand-list',          label: 'Brands',            icon: Tag,             roles: ['SuperUser'] },
  { to: '/order-list',          label: 'Orders',            icon: ShoppingCart,    roles: ['SuperUser', 'SalesExecutive'] },
  { to: '/transactions',        label: 'Transactions',      icon: Receipt,         roles: ['SuperUser'] },
  { to: '/transaction-ledger',  label: 'Ledger',            icon: BookOpen,        roles: ['SuperUser'] },
  { to: '/credit-notes',        label: 'Credit Notes',      icon: FileText,        roles: ['SuperUser'] },
  { to: '/product-offers',      label: 'Product Offers',    icon: Percent,         roles: ['SuperUser'] },
  { to: '/reward-schemes',      label: 'Reward Schemes',    icon: Gift,            roles: ['SuperUser'] },
  { to: '/payouts',             label: 'Payouts',           icon: Wallet,          roles: ['SuperUser'] },
];

export function Sidebar() {
  const accountType = useAuthStore((s) => s.accountType);
  const visible = NAV.filter((i) => (accountType ? i.roles.includes(accountType) : false));
  return (
    <aside className="w-64 shrink-0 border-r bg-card">
      <nav className="flex flex-col gap-1 p-4">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
