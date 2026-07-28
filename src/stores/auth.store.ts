import { create } from 'zustand';
import { authApi } from '@/api/auth.api';
import { HttpError } from '@/api/http.client';
import type { User } from '@/types/auth.types';
import { tokenStorage } from '@/utils/token-storage.util';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Restore a session after a page reload using the persisted refresh token. */
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  async login(email, password) {
    set({ status: 'loading', error: null });
    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, status: 'authenticated' });
    } catch (error) {
      const message =
        error instanceof HttpError && error.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      set({ user: null, status: 'unauthenticated', error: message });
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      // Best effort — the client-side session is cleared regardless.
    }
    tokenStorage.clear();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  async bootstrap() {
    if (!tokenStorage.getRefreshToken()) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      // me() 401s on the stale access token; the HTTP client refreshes and retries.
      const user = await authApi.me();
      set({ user, status: 'authenticated' });
    } catch {
      tokenStorage.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
