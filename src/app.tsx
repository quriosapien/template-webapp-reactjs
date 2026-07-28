import { BrowserRouter, Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/require-auth.component';
import { DashboardPage } from '@/pages/dashboard.page';
import { HomePage } from '@/pages/home.page';
import { LoginPage } from '@/pages/login.page';
import { NotFoundPage } from '@/pages/not-found.page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
