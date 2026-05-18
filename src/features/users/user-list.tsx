import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersPanel } from './users-panel';
import { UnverifiedUsersPanel } from './unverified-users-panel';

type TabValue = 'users' | 'unverified';

function initialTab(pathname: string): TabValue {
  return pathname.startsWith('/unverified-users') ? 'unverified' : 'users';
}

export function UserList() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabValue>(initialTab(pathname));

  // Keep the URL in sync with the active tab so deep-links + sidebar highlights
  // still work for /unverified-users.
  const handleChange = (next: string) => {
    const value = (next as TabValue) === 'unverified' ? 'unverified' : 'users';
    setTab(value);
    const target = value === 'unverified' ? '/unverified-users' : '/users';
    if (pathname !== target) navigate(target, { replace: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <Tabs value={tab} onValueChange={handleChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="unverified">Unverified Users</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <Card>
            <UsersPanel />
          </Card>
        </TabsContent>

        <TabsContent value="unverified" className="mt-0">
          <Card>
            <UnverifiedUsersPanel />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
