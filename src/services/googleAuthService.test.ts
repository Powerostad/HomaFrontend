import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginWithGoogle, startGoogleLogin } from './googleAuthService';
import { apiGet, apiPost } from '@/utils/apiClient';

vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

describe('Google login API contract', () => {
  it('requests a browser-bound challenge and does not refresh JWTs on login failures', async () => {
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: { enabled: false } });
    expect(await startGoogleLogin()).toEqual({ enabled: false });
    expect(apiGet).toHaveBeenCalledWith('/users/google/start/', undefined,
      expect.objectContaining({ credentials: 'include', skipAuth: true, skipRetryOn401: true, cache: 'no-store' }));
  });

  it('uses the existing user/token contract without inventing a phone number', async () => {
    vi.mocked(apiPost).mockResolvedValue({ success: true, data: {
      user: { id: 12, phone_number: null, email: 'test@gmail.com', name: 'Test', created_at: 'today' },
      tokens: { access: 'access', refresh: 'refresh' },
    } });
    const result = await loginWithGoogle('google-id-token');
    expect(result.user).toEqual({ id: '12', phone: undefined, email: 'test@gmail.com', name: 'Test', createdAt: 'today' });
    expect(result.tokens).toEqual({ access: 'access', refresh: 'refresh' });
    expect(apiPost).toHaveBeenCalledWith('/users/google/login/', { credential: 'google-id-token' },
      expect.objectContaining({ credentials: 'include', skipRetryOn401: true }));
  });

  it('returns a safe failure instead of a raw provider message', async () => {
    vi.mocked(apiPost).mockResolvedValue({ success: false, error: 'raw provider error' });
    expect(await loginWithGoogle('bad-token')).toEqual({ success: false, error: 'google_login_failed' });
  });
});
