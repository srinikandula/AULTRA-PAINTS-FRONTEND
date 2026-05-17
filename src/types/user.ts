export type AccountType = 'SuperUser' | 'SalesExecutive' | 'Dealer' | 'Painter';

export type User = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  accountType: AccountType;
  dealerCode?: string;
  parentDealerCode?: string;
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
