import { Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/require-auth.component';
import { DashboardPage } from '@/pages/dashboard.page';
import { HomePage } from '@/pages/home.page';
import { LoginPage } from '@/pages/login.page';
import { NotFoundPage } from '@/pages/not-found.page';

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
} as const;

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />

      {/* Protected routes (require authentication) */}
      <Route element={<RequireAuth />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
