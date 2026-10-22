import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingBlock } from '@/components/ui/feedback';
import { useSession } from './api';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useSession();
  const location = useLocation();

  if (isPending) return <LoadingBlock />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
