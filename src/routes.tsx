import { Route, Routes, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { RoleGate } from '@/components/layout/role-gate';
import { NoAuthRoute } from '@/components/layout/no-auth-route';
import { Login } from '@/features/auth/login';
import { Register } from '@/features/auth/register';
import { Dashboard } from '@/features/dashboard/dashboard';
import { UserList as Users } from '@/features/users/user-list';
import { UnverifiedUsers } from '@/features/users/unverified-users';
import { BrandList } from '@/features/brands/brand-list';
import { ProductList } from '@/features/products/product-list';
import { CreateProduct } from '@/features/products/create-product';
import { EditProduct } from '@/features/products/edit-product';
import { ProductCategoryList } from '@/features/products/product-category-list';
import { ProductCatalog } from '@/features/products/product-catlog';
import { ProductDataList } from '@/features/products/product-data-list';
import { BatchList } from '@/features/batches/batch-list';
import { CreateBatch } from '@/features/batches/create-batch';
import { OrderList } from '@/features/orders/order-list';
import { Transactions } from '@/features/transactions/transactions';
import { TransactionLedger } from '@/features/transactions/transaction-ledger';
import { CreditNotes } from '@/features/credit-notes/credit-notes';
import { ProductOffers } from '@/features/product-offers/product-offers';
import { RewardSchemes } from '@/features/reward-schemes/reward-schemes';
import { Payouts } from '@/features/payouts/payouts';
import { PrivacyPolicy } from '@/features/privacy-policy/privacy-policy';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public — only visible when logged out */}
      <Route element={<NoAuthRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>

      {/* Authenticated area — wrapped in AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />

          {/* SuperUser-only */}
          <Route element={<RoleGate roles={['SuperUser']} />}>
            <Route path="/users" element={<Users />} />
            <Route path="/unverified-users" element={<UnverifiedUsers />} />
            <Route path="/batch-list" element={<BatchList />} />
            <Route path="/create-batch" element={<CreateBatch />} />
            <Route path="/product-list" element={<ProductList />} />
            <Route path="/create-product" element={<CreateProduct />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
            <Route path="/product-category-list" element={<ProductCategoryList />} />
            <Route path="/product-catalog" element={<ProductCatalog />} />
            <Route path="/product-data-list" element={<ProductDataList />} />
            <Route path="/brand-list" element={<BrandList />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transaction-ledger" element={<TransactionLedger />} />
            <Route path="/credit-notes" element={<CreditNotes />} />
            <Route path="/product-offers" element={<ProductOffers />} />
            <Route path="/reward-schemes" element={<RewardSchemes />} />
            <Route path="/payouts" element={<Payouts />} />
          </Route>

          {/* SuperUser + SalesExecutive */}
          <Route element={<RoleGate roles={['SuperUser', 'SalesExecutive']} />}>
            <Route path="/order-list" element={<OrderList />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
