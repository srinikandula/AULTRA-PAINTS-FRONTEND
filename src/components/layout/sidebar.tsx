import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, type AccountType } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, UserX, ClipboardList, Layers, Tags, Tag,
  ShoppingCart, Ticket, ArrowRightLeft, Receipt, BadgePercent, Gift, Wallet,
  Database, LayoutGrid, ChevronDown, ChevronRight,
} from 'lucide-react';

type NavLeaf = {
  kind: 'leaf';
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AccountType[];
};

type NavGroup = {
  kind: 'group';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AccountType[];
  children: NavLeaf[];
};

type NavEntry = NavLeaf | NavGroup;

const NAV: NavEntry[] = [
  { kind: 'leaf', to: '/',                   label: 'Dashboard',        icon: LayoutDashboard, roles: ['SuperUser', 'SalesExecutive', 'Dealer', 'Painter'] },
  {
    kind: 'group',
    label: 'Master Data',
    icon: Database,
    roles: ['SuperUser'],
    children: [
      { kind: 'leaf', to: '/users',          label: 'Users',           icon: Users,        roles: ['SuperUser'] },
      { kind: 'leaf', to: '/brand-list',     label: 'Brands',          icon: Tag,          roles: ['SuperUser'] },
      { kind: 'leaf', to: '/product-list',   label: 'Products',        icon: Layers,       roles: ['SuperUser'] },
      { kind: 'leaf', to: '/product-offers', label: 'Product Offers',  icon: BadgePercent, roles: ['SuperUser'] },
      { kind: 'leaf', to: '/product-catalog', label: 'Product Catalog', icon: LayoutGrid,  roles: ['SuperUser'] },
    ],
  },
  { kind: 'leaf', to: '/unverified-users',   label: 'Unverified Users', icon: UserX,          roles: ['SuperUser'] },
  { kind: 'leaf', to: '/batch-list',         label: 'Batches',          icon: ClipboardList,  roles: ['SuperUser'] },
  { kind: 'leaf', to: '/product-category-list', label: 'Categories',    icon: Tags,           roles: ['SuperUser'] },
  { kind: 'leaf', to: '/order-list',         label: 'Orders',           icon: ShoppingCart,   roles: ['SuperUser', 'SalesExecutive'] },
  { kind: 'leaf', to: '/transactions',       label: 'Transactions',     icon: Ticket,         roles: ['SuperUser'] },
  { kind: 'leaf', to: '/transaction-ledger', label: 'Ledger',           icon: ArrowRightLeft, roles: ['SuperUser'] },
  { kind: 'leaf', to: '/credit-notes',       label: 'Credit Notes',     icon: Receipt,        roles: ['SuperUser'] },
  { kind: 'leaf', to: '/reward-schemes',     label: 'Reward Schemes',   icon: Gift,           roles: ['SuperUser'] },
  { kind: 'leaf', to: '/payouts',            label: 'Payouts',          icon: Wallet,         roles: ['SuperUser'] },
];

function entryVisibleFor(entry: NavEntry, accountType: AccountType | null): boolean {
  if (!accountType) return false;
  if (entry.kind === 'leaf') return entry.roles.includes(accountType);
  // Group is visible if any child is visible (or if the group's own roles allow it).
  return entry.roles.includes(accountType)
    && entry.children.some((c) => c.roles.includes(accountType));
}

export function Sidebar() {
  const accountType = useAuthStore((s) => s.accountType);
  const { pathname } = useLocation();

  // Auto-expand any group containing the currently-active route, so a refresh
  // on a child URL doesn't show a collapsed parent.
  const initiallyOpen = new Set<string>();
  for (const entry of NAV) {
    if (entry.kind === 'group' && entry.children.some((c) => c.to === pathname)) {
      initiallyOpen.add(entry.label);
    }
  }
  const [open, setOpen] = useState<Set<string>>(initiallyOpen);

  const toggle = (label: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const visible = NAV.filter((entry) => entryVisibleFor(entry, accountType));

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground">
      <nav className="flex flex-col gap-1 p-4">
        {visible.map((entry) => {
          if (entry.kind === 'leaf') {
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-sidebar-foreground',
                  )
                }
              >
                <entry.icon className="h-4 w-4" />
                {entry.label}
              </NavLink>
            );
          }

          const isOpen = open.has(entry.label);
          const childActive = entry.children.some((c) => c.to === pathname);
          const visibleChildren = entry.children.filter((c) =>
            accountType ? c.roles.includes(accountType) : false,
          );

          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => toggle(entry.label)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  childActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-sidebar-foreground',
                )}
                aria-expanded={isOpen}
              >
                <entry.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{entry.label}</span>
                {isOpen
                  ? <ChevronDown className="h-4 w-4 opacity-70" />
                  : <ChevronRight className="h-4 w-4 opacity-70" />}
              </button>

              {isOpen && (
                <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-sidebar-foreground/20 pl-3">
                  {visibleChildren.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-hover hover:text-sidebar-foreground',
                        )
                      }
                    >
                      <child.icon className="h-3.5 w-3.5" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
