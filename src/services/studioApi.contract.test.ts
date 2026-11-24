// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatSession, loadChatSession } from '@/pages/RoomRedesign/services/redesignChatService';
import { apiGet, setStoredTokens } from '@/utils/apiClient';

vi.mock('@/config/appConfig', () => ({
  appConfig: { apiBaseUrl: 'https://api.example.test', apiTimeout: 30_000 },
}));
vi.mock('@/i18n/siteCopy', () => ({ siteText: (text: string) => text }));
vi.mock('@/i18n/config', () => ({ default: { language: 'fa', t: (key: string) => key } }));
const http = vi.fn<typeof fetch>();
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  localStorage.clear();
  setStoredTokens({ access: 'account-access', refresh: 'account-refresh' });
  http.mockReset();
  vi.stubGlobal('fetch', http);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('API-STUDIO — authenticated HTTP contract', () => {
  it('creates a session using the account token and the requested image mode', async () => {
    http.mockResolvedValue(reply(201, { data: { session_id: 'new-session', status: 'active' } }));
    expect(await createChatSession('api')).toEqual({
      success: true, data: { sessionId: 'new-session', status: 'active' },
    });
    const [url, request] = http.mock.calls[0];
    expect(url).toBe('https://api.example.test/api/recommendations/chat/sessions/');
    expect(request?.method).toBe('POST');
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer account-access');
    expect(JSON.parse(request!.body as string)).toMatchObject({ image_output_mode: 'api' });
    expect(http).toHaveBeenCalledTimes(1);
  });

  it.each([402, 429, 503])('does not create or retry a session on HTTP %s', async status => {
    http.mockResolvedValue(reply(status, { message: 'Cannot start design' }));
    expect(await createChatSession()).toEqual({ success: false, error: 'Cannot start design' });
    expect(http).toHaveBeenCalledTimes(1);
  });

  it.each([403, 404])('returns session access failure HTTP %s without a result', async status => {
    http.mockResolvedValue(reply(status, { message: 'Session unavailable' }));
    expect(await loadChatSession('private-session')).toEqual({
      success: false, statusCode: status, error: 'Session unavailable',
    });
  });

  it('preserves signed image URLs and purchase data when resuming a design', async () => {
    const data = { session_id: 'existing', image_url: 'https://media.example/room?X-Amz-Signature=a%2Bb',
      products: [{ id: 11, price: 150000, link: 'https://seller.example/item/11' }] };
    http.mockResolvedValue(reply(200, { data }));
    expect(await loadChatSession('existing', 'version/2')).toEqual({ success: true, data });
    expect(http.mock.calls[0][0]).toBe('https://api.example.test/api/recommendations/chat/sessions/existing/?version_id=version%2F2');
  });

  it('refreshes once and retries a protected request with the rotated JWT', async () => {
    http.mockResolvedValueOnce(reply(401, { message: 'Expired' }))
      .mockResolvedValueOnce(reply(200, { access: 'rotated-access', refresh: 'rotated-refresh' }))
      .mockResolvedValueOnce(reply(200, { data: { balance: 2 } }));
    expect(await apiGet('/payments/sizpay/offer/')).toMatchObject({ success: true, data: { balance: 2 } });
    expect(http).toHaveBeenCalledTimes(3);
    expect(http.mock.calls[1][0]).toBe('https://api.example.test/api/users/refresh/');
    expect(new Headers(http.mock.calls[2][1]?.headers).get('Authorization')).toBe('Bearer rotated-access');
  });

  it('returns failure for a malformed server response', async () => {
    http.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    expect(await createChatSession()).toMatchObject({ success: false, error: expect.any(String) });
    expect(http).toHaveBeenCalledTimes(1);
  });
});
