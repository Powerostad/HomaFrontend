// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/config/appConfig', () => ({ appConfig: { apiBaseUrl: 'https://site.example', apiTimeout: 30_000 } }));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (s: string) => s }));
vi.mock('@/i18n/config', () => ({ default: { language: 'en' } }));
let client: typeof import('./apiClient');
const tokens = { access: 'test-access', refresh: 'test-refresh' };
beforeEach(async () => {
  vi.resetModules(); localStorage.clear();
  client = await import('./apiClient'); client.setStoredTokens(tokens);
  vi.stubGlobal('fetch', vi.fn());
});

describe('signed media authentication boundary', () => {
  it.each(['https://site.example/homa/image.png?X-Amz-Signature=test', 'https://cdn.example/image.png'])('never sends the API JWT to %s', async url => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    vi.mocked(fetch).mockResolvedValue({ ok: true, blob: async () => new Blob() } as Response);
    await client.fetchAuthenticatedImage(url);
    expect(fetch).toHaveBeenCalledWith(url, { headers: {} });
  });
  it('still authenticates legacy own-API media', async () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    vi.mocked(fetch).mockResolvedValue({ ok: true, blob: async () => new Blob() } as Response);
    await client.fetchAuthenticatedImage('https://site.example/api/images/1/');
    expect(fetch).toHaveBeenCalledWith('https://site.example/api/images/1/', { headers: { Authorization: 'Bearer test-access' } });
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const response = (status: number, data = {}) => ({ ok: status === 200, status, json: async () => data });
describe('rotating login recovery', () => {
  it('shares one refresh across concurrent callers', async () => {
    vi.mocked(fetch).mockResolvedValue(response(200, { access: 'next-access', refresh: 'next-refresh' }) as Response);
    expect(await Promise.all([client.refreshAccessToken(), client.refreshAccessToken()])).toEqual(['next-access', 'next-access']);
    expect(fetch).toHaveBeenCalledOnce(); expect(client.getStoredTokens()?.refresh).toBe('next-refresh');
  });
  it('uses the rotated token from another tab instead of consuming it again', async () => {
    const request = vi.fn(async (_name, refresh: () => Promise<string | null>) => {
      client.setStoredTokens({ access: 'other-tab-access', refresh: 'other-tab-refresh' });
      return refresh();
    });
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
    expect(await client.refreshAccessToken()).toBe('other-tab-access');
    expect(fetch).not.toHaveBeenCalled();
    delete (navigator as unknown as { locks?: unknown }).locks;
  });
  it('does not clear a newer login when an old token receives a late 401', async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      client.setStoredTokens({ access: 'new-login-access', refresh: 'new-login-refresh' });
      return response(401) as Response;
    });
    expect(await client.refreshAccessToken()).toBe('new-login-access');
    expect(client.getStoredTokens()?.refresh).toBe('new-login-refresh');
  });
  it('does not replace a newer login with an old successful refresh', async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      client.setStoredTokens({ access: 'new-login-access', refresh: 'new-login-refresh' });
      return response(200, { access: 'stale-access', refresh: 'stale-refresh' }) as Response;
    });
    expect(await client.refreshAccessToken()).toBe('new-login-access');
    expect(client.getStoredTokens()?.refresh).toBe('new-login-refresh');
  });
  it.each([429, 500, 503])('preserves the login on transient HTTP %s', async status => {
    vi.mocked(fetch).mockResolvedValue(response(status) as Response);
    expect(await client.refreshAccessToken()).toBeNull(); expect(client.getStoredTokens()).toEqual(tokens);
  });
  it('preserves the login on an offline connection', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('network unavailable'));
    expect(await client.refreshAccessToken()).toBeNull(); expect(client.getStoredTokens()).toEqual(tokens);
  });
  it('still clears genuinely rejected current credentials', async () => {
    vi.mocked(fetch).mockResolvedValue(response(401) as Response);
    expect(await client.refreshAccessToken()).toBeNull(); expect(client.getStoredTokens()).toBeNull();
  });
});
