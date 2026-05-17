import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setApiNavigate } from '@/lib/api';

// Mount once inside <BrowserRouter>. Registers Router's navigate with the
// api() module so 401s can redirect without a full page reload.
export function ApiNavigateBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setApiNavigate((path, options) => navigate(path, options));
    return () => setApiNavigate(null);
  }, [navigate]);
  return null;
}
