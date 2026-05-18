export type { AccountType } from '@/stores/auth-store';

// All account types a User record may carry. The auth-store's `AccountType`
// covers the four roles that can sign in; `UserAccountType` widens that to
// include `Contractor` (a record-only role that does not have its own login
// flow in the portal).
export type UserAccountType =
  | 'Painter'
  | 'Contractor'
  | 'Dealer'
  | 'SuperUser'
  | 'SalesExecutive';

export type User = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  accountType: UserAccountType;
  dealerCode?: string;
  parentDealerCode?: string;
  parentSalesExecutive?: string;
  address?: string;
  state?: string;
  zone?: string;
  district?: string;
  rewardPoints?: number;
  cash?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  data: T[];
  pagination: { currentPage: number; totalPages: number; totalRecords: number };
};
