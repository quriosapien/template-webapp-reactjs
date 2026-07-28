import { Link } from 'react-router';
import { ROUTES } from '@/routes';

export function NotFoundPage() {
  return (
    <main className="mx-auto mt-16 max-w-xl p-8 text-center">
      <h1 className="mb-2 text-3xl font-bold">404</h1>
      <p className="mb-6 text-slate-600">This page does not exist.</p>
      <Link to={ROUTES.home} className="font-semibold text-indigo-600 underline">
        Back home
      </Link>
    </main>
  );
}
