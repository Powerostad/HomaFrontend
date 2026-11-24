// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginWithPassword, sendOTP, verifyOTP } from './authService';
import { getStoredTokens, setStoredTokens } from '@/utils/apiClient';

vi.mock('@/config/appConfig', () => ({
  appConfig: { apiBaseUrl: 'https://api.example.test', apiTimeout: 30_000 },
}));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (text: string) => text }));
vi.mock('@/i18n/config', () => ({ default: { language: 'fa', t: (key: string) => key } }));

const http = vi.fn<typeof fetch>();
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
beforeEach(() => {
  localStorage.clear();
  http.mockReset();
  vi.stubGlobal('fetch', http);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('API-AUTH — login HTTP contract', () => {
  it('normalizes Persian mobile digits and sends OTP without an existing JWT', async () => {
    setStoredTokens({ access: 'old-access', refresh: 'old-refresh' });
    http.mockResolvedValue(reply(200, { data: { expires_in_seconds: 120 } }));
    expect(await sendOTP('۰۹۱۲ ۳۴۵ ۶۷۸۹')).toEqual({ success: true, expiresIn: 120 });
    const [url, request] = http.mock.calls[0];
    expect(url).toBe('https://api.example.test/api/users/otp/send/');
    expect(request?.method).toBe('POST');
    expect(JSON.parse(request!.body as string)).toEqual({ phone_number: '09123456789', purpose: 'login' });
    expect(new Headers(request?.headers).has('Authorization')).toBe(false);
    expect(http).toHaveBeenCalledTimes(1);
  });

  it('stores the verified account and tokens for subsequent authenticated requests', async () => {
    const tokens = { access: 'verified-access', refresh: 'verified-refresh' };
    http.mockResolvedValue(reply(200, { data: {
      user: { id: 7, phone_number: '09123456789', name: 'Test', created_at: '2026-01-01' }, tokens,
    } }));
    const result = await verifyOTP('09123456789', '123456');
    expect(result).toMatchObject({ success: true, user: { id: '7' }, tokens });
    expect(getStoredTokens()).toEqual(tokens);
    expect(http.mock.calls[0][0]).toBe('https://api.example.test/api/users/otp/verify/');
    expect(JSON.parse(http.mock.calls[0][1]!.body as string)).toEqual({
      phone_number: '09123456789', otp_code: '123456', purpose: 'login',
    });
  });

  it.each([400, 410, 429, 503])('returns OTP failure HTTP %s without authenticating', async status => {
    http.mockResolvedValue(reply(status, { message: 'OTP unavailable' }));
    expect(await verifyOTP('09123456789', '000000')).toMatchObject({ success: false, error: expect.any(String) });
    expect(getStoredTokens()).toBeNull();
    expect(http).toHaveBeenCalledTimes(1);
  });

  it('does not refresh a previous account or repeat a rejected password login', async () => {
    const tokens = { access: 'previous-access', refresh: 'previous-refresh' };
    setStoredTokens(tokens);
    http.mockResolvedValue(reply(401, { message: 'Invalid credentials' }));
    expect(await loginWithPassword('09123456789', 'incorrect')).toMatchObject({ success: false });
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toBe('https://api.example.test/api/users/login/');
    expect(getStoredTokens()).toEqual(tokens);
  });

  it('reports a network outage without recording a login', async () => {
    http.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await sendOTP('09123456789')).toMatchObject({ success: false, error: expect.any(String) });
    expect(getStoredTokens()).toBeNull();
    expect(http).toHaveBeenCalledTimes(1);
  });
});
