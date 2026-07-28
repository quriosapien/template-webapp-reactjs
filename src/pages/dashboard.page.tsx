import { useNavigate } from 'react-router';
import { ROUTES } from '@/routes';
import { useAuthStore } from '@/stores/auth.store';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <main className="mx-auto mt-16 max-w-xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-slate-600">
        Signed in as <strong>{user?.name}</strong> ({user?.email})
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white"
      >
        Sign out
      </button>
    </main>
  );
}
