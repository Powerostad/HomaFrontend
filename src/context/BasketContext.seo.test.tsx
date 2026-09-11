// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BasketProvider, useBasket } from './BasketContext';
import { basketService } from '../services/basketService';
import { EMPTY_BASKET } from '../types/basket';

vi.mock('./AuthContext', () => ({ useAuth: () => ({ isInitialized: true, isLoggedIn: false }) }));
vi.mock('../services/basketService', () => ({ basketService: { fetchBasket: vi.fn() } }));
vi.mock('../utils/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../utils/apiClient', () => ({ AUTH_LOGIN_EVENT: 'login', AUTH_LOGOUT_EVENT: 'logout' }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { localStorage.clear(); vi.clearAllMocks(); });

it('restores the anonymous server basket after crossing the public/private document boundary', async () => {
  localStorage.setItem('homa_session_id', 'synthetic-session');
  vi.mocked(basketService.fetchBasket).mockResolvedValue({ success: true, data: { ...EMPTY_BASKET, item_count: 2 } });
  const node = document.createElement('div');
  const root = createRoot(node);
  function Count() { return <span>{useBasket().itemCount}</span>; }
  await act(async () => { root.render(<BasketProvider><Count /></BasketProvider>); });
  expect(node.textContent).toBe('2');
  expect(basketService.fetchBasket).toHaveBeenCalledTimes(1);
  await act(async () => root.unmount());
});
