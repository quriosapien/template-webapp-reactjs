import { Link } from 'react-router';
import logoUrl from '@/assets/logo.svg';
import { config } from '@/config';

export function HomePage() {
  return (
    <main className="mx-auto mt-16 max-w-xl p-8 text-center">
      <img src={logoUrl} alt="Logo" className="mx-auto mb-6 h-16 w-16" />
      <h1 className="mb-2 text-3xl font-bold">{config.VITE_APP_NAME}</h1>
      <p className="mb-8 text-slate-600">
        React 19 + TS7 + Vite template with JWT auth, routing, and state management.
      </p>
      <Link to="/dashboard" className="font-semibold text-indigo-600 underline">
        Go to dashboard (protected)
      </Link>
    </main>
  );
}
