import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DEMO_USER, makeFakeJwt } from '@/mocks/handlers';
import { useAuthStore } from '@/stores/auth.store';
import { tokenStorage } from '@/utils/token-storage.util';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('login stores the user and tokens on success', async () => {
    await useAuthStore.getState().login(DEMO_USER.email, DEMO_PASSWORD);

    const { user, status, error } = useAuthStore.getState();
    expect(status).toBe('authenticated');
    expect(user).toEqual(DEMO_USER);
    expect(error).toBeNull();
    expect(tokenStorage.getAccessToken()).not.toBeNull();
    expect(tokenStorage.getRefreshToken()).not.toBeNull();
  });

  it('login surfaces a friendly error for invalid credentials', async () => {
    await useAuthStore.getState().login(DEMO_USER.email, 'wrong-password');

    const { user, status, error } = useAuthStore.getState();
    expect(status).toBe('unauthenticated');
    expect(user).toBeNull();
    expect(error).toBe('Invalid email or password');
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('logout clears the session even if the API call fails', async () => {
    await useAuthStore.getState().login(DEMO_USER.email, DEMO_PASSWORD);
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('bootstrap restores the session from a stored refresh token', async () => {
    tokenStorage.setTokens(makeFakeJwt(DEMO_USER.id, -60), makeFakeJwt(DEMO_USER.id, 3600));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user).toEqual(DEMO_USER);
  });

  it('bootstrap resolves to unauthenticated when no refresh token exists', async () => {
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
