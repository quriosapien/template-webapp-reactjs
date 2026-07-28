import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';
import { config } from '@/config';
import { useAuthStore } from '@/stores/auth.store';
import '@/styles/index.css';

/**
 * Dev-only API mocking. `import.meta.env.DEV` is replaced at build time, so
 * production bundles drop this branch — and the dynamic import — entirely.
 */
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || !config.VITE_USE_MSW) {
    return;
  }
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

enableMocking().then(() => {
  // Fire-and-forget: RequireAuth renders a loading state until this resolves.
  void useAuthStore.getState().bootstrap();

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
