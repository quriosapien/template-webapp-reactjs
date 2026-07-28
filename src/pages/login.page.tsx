import type { FormEvent } from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ROUTES } from '@/routes';
import { useAuthStore } from '@/stores/auth.store';

// Literal (not imported from @/mocks) so production bundles never pull in MSW.
const DEMO_EMAIL = 'demo@example.com';

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password);
    if (useAuthStore.getState().status === 'authenticated') {
      const from = (location.state as { from?: string } | null)?.from ?? ROUTES.dashboard;
      navigate(from, { replace: true });
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm rounded-xl border border-slate-200 p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        Demo credentials: {DEMO_EMAIL} / password123 (served by MSW in dev)
      </p>
    </main>
  );
}
