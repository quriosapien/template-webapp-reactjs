import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DEMO_USER } from '@/mocks/handlers';
import { LoginPage } from '@/pages/login.page';
import { useAuthStore } from '@/stores/auth.store';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('logs in with valid credentials and navigates to the dashboard', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), DEMO_USER.email);
    await user.type(screen.getByLabelText(/password/i), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Dashboard destination')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('shows the store error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
