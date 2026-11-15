// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { GoogleSignIn } from './GoogleSignIn';
import { loginWithGoogle, startGoogleLogin } from '@/services/googleAuthService';

vi.mock('@/services/googleAuthService', () => ({ startGoogleLogin: vi.fn(), loginWithGoogle: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({
  t: (key: string) => key, i18n: { language: 'en', resolvedLanguage: 'en' },
}) }));

let root: Root;
let container: HTMLDivElement;
let callback: (response: { credential: string }) => void;
const success = vi.fn();
const busy = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  window.google = { accounts: { id: {
    initialize: vi.fn(options => { callback = options.callback; }),
    renderButton: vi.fn(element => { element.append(document.createElement('button')); }),
  } } };
  vi.mocked(startGoogleLogin).mockResolvedValue({ enabled: true, client_id: 'client', nonce: 'nonce' });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  flushSync(() => root.unmount());
  container.remove();
  delete window.google;
});

function render(disabled = false) {
  flushSync(() => root.render(<GoogleSignIn disabled={disabled} onBusyChange={busy} onSuccess={success} />));
}

describe('Google sign-in alongside OTP', () => {
  it('hides Google when not configured rather than displaying a broken button', async () => {
    vi.mocked(startGoogleLogin).mockResolvedValue({ enabled: false });
    render();
    await vi.waitFor(() => expect(container.firstElementChild?.className).toBe('hidden'));
    expect(window.google?.accounts.id.initialize).not.toHaveBeenCalled();
  });

  it('renders the official Google button with the server nonce', async () => {
    render();
    await vi.waitFor(() => expect(container.querySelector('button')).not.toBeNull());
    expect(window.google?.accounts.id.initialize).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'client', nonce: 'nonce', auto_select: false,
    }));
    expect(window.google?.accounts.id.renderButton).toHaveBeenCalledWith(expect.any(HTMLElement),
      expect.objectContaining({ locale: 'en', text: 'continue_with' }));
  });

  it('passes successful login to the existing auth flow once', async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({ success: true,
      user: { id: '1', name: 'Test', email: 'test@gmail.com' }, tokens: { access: 'a', refresh: 'r' } });
    render();
    await vi.waitFor(() => expect(container.querySelector('button')).not.toBeNull());
    callback({ credential: 'token' });
    callback({ credential: 'token' });
    await vi.waitFor(() => expect(success).toHaveBeenCalledOnce());
    expect(loginWithGoogle).toHaveBeenCalledOnce();
    expect(busy.mock.calls).toEqual([[true], [false]]);
  });

  it('cannot start Google login during an OTP request', async () => {
    render(true);
    await vi.waitFor(() => expect(container.querySelector('button')).not.toBeNull());
    callback({ credential: 'token' });
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(container.querySelector('[inert]')).not.toBeNull();
  });

  it('offers a fresh challenge after a failed Google login', async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({ success: false });
    render();
    await vi.waitFor(() => expect(container.querySelector('button')).not.toBeNull());
    callback({ credential: 'token' });
    await vi.waitFor(() => expect(container.querySelector('[role="alert"]')).not.toBeNull());
    const retry = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'auth.googleRetry');
    retry?.click();
    await vi.waitFor(() => expect(startGoogleLogin).toHaveBeenCalledTimes(2));
  });
});
