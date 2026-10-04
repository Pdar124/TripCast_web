import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/admin/store/auth-store';

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate replace state={{ from: location.pathname }} to="/admin/login" />;
  }

  return children;
}
