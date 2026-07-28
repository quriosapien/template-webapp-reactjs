import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';

/** Route-group guard: wrap protected <Route>s so children render via <Outlet />. */
export function RequireAuth() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <p className="p-8 text-slate-500">Loading session…</p>;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
