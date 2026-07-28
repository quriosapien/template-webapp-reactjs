import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequireAuth } from '@/components/require-auth.component';
import { DEMO_USER } from '@/mocks/handlers';
import { useAuthStore } from '@/stores/auth.store';

function renderDashboardRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<p>Secret dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('redirects unauthenticated users to /login', () => {
    useAuthStore.setState({ status: 'unauthenticated' });
    renderDashboardRoute();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('shows a loading state while the session bootstraps', () => {
    useAuthStore.setState({ status: 'loading' });
    renderDashboardRoute();
    expect(screen.getByText(/loading session/i)).toBeInTheDocument();
  });

  it('renders the protected route when authenticated', () => {
    useAuthStore.setState({ status: 'authenticated', user: DEMO_USER });
    renderDashboardRoute();
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
  });
});
