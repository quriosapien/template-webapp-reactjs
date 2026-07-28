import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/server';
import { tokenStorage } from '@/utils/token-storage.util';

/**
 * Node >= 24 defines a stubbed global `localStorage` (the Web Storage API,
 * gated behind --localstorage-file) that shadows jsdom's implementation.
 * Vitest's jsdom environment doesn't know about this Node global, so it
 * leaves it in place instead of overriding it — repoint it at jsdom's real,
 * spec-compliant Storage so `localStorage` behaves as it does in a browser.
 */
const dom = (globalThis as unknown as { jsdom?: { window: { localStorage: Storage } } }).jsdom;
if (dom) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => dom.window.localStorage,
  });
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  tokenStorage.clear();
  localStorage.clear();
});

afterAll(() => server.close());
