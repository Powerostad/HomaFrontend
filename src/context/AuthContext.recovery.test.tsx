// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as auth from '@/services/authService';
import { clearAuthData } from '@/utils/apiClient';

vi.mock('@/analytics/events', () => ({ identifyUser: vi.fn(), resetUser: vi.fn(), trackAuthEvent: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (s: string) => s, siteValue: (v: unknown) => v }) }));
vi.mock('@/utils/apiClient', () => ({ clearAuthData: vi.fn(), getStoredTokens: vi.fn(), AUTH_LOGOUT_EVENT: 'logout', AUTH_LOGIN_EVENT: 'login' }));
vi.mock('@/services/authService', () => ({ getStoredAuthState: vi.fn(), isTokenExpired: vi.fn(), refreshToken: vi.fn(),
  getProfile: vi.fn(), logout: vi.fn(), updateProfile: vi.fn(), storeAuthState: vi.fn() }));

const saved = { user: { id: 'tester', name: 'Tester' }, tokens: { access: 'test-access', refresh: 'test-refresh' }, expiresAt: 0 } as unknown as NonNullable<ReturnType<typeof auth.getStoredAuthState>>;
let currentUser: ReturnType<typeof useAuth>['user'];
function Probe() { currentUser = useAuth().user; return null; }
beforeEach(() => {
  vi.resetAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(auth.getStoredAuthState).mockReturnValue(saved);
  vi.mocked(auth.isTokenExpired).mockReturnValue(true);
});
async function check() {
  const root = createRoot(document.createElement('div'));
  try {
    await act(async () => { root.render(<AuthProvider><Probe /></AuthProvider>); });
    return currentUser;
  } finally { await act(async () => root.unmount()); }
}
describe('auth initialization recovery', () => {
  it('retains the saved account when refresh returns a transient failure', async () => {
    vi.mocked(auth.refreshToken).mockResolvedValue(null);
    expect(await check()).toEqual(saved.user);
    expect(clearAuthData).not.toHaveBeenCalled();
  });
  it('does not restore an account whose credentials were revoked', async () => {
    vi.mocked(auth.refreshToken).mockImplementation(async () => {
      vi.mocked(auth.getStoredAuthState).mockReturnValue(null); return null;
    });
    expect(await check()).toBeNull();
  });
  it('retains saved state if refresh unexpectedly throws', async () => {
    vi.mocked(auth.refreshToken).mockRejectedValue(new Error('offline'));
    expect(await check()).toEqual(saved.user);
    expect(clearAuthData).not.toHaveBeenCalled();
  });
});
