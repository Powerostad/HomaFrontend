// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { apiGet, apiPost } from '@/utils/apiClient';
import { StudioCreditPurchase } from './StudioCreditPurchase';

vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({
  useSiteTranslation: () => ({
    siteLocale: () => 'en-GB',
    siteText: (value: string, vars?: Record<string, string>) =>
      value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars?.[key] ?? ''),
  }),
}));

it('shows the current package and hands only gateway fields to Sizpay', async () => {
  vi.mocked(apiGet).mockResolvedValue({
    success: true, data: { code: 'small', price_irr: 120_000, credits: 2, balance: 1 },
  });
  vi.mocked(apiPost).mockResolvedValue({
    success: true,
    data: {
      action: 'https://rt.sizpay.ir/Route/Payment',
      fields: { MerchantID: '123', TerminalID: '456', Token: 'test-token' },
    },
  });
  const submitted = vi.fn();
  const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
    submitted(this.action, Object.fromEntries(new FormData(this)));
  });
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(async () => root.render(<MemoryRouter><StudioCreditPurchase /></MemoryRouter>));
    expect(host.textContent).toContain('12,000 تومان');
    expect(host.textContent).toContain('2 اعتبار طراحی');
    await act(async () => host.querySelector('button')?.click());
    expect(apiPost).toHaveBeenCalledWith('/payments/sizpay/checkout/', {
      code: 'small', price_irr: 120_000, credits: 2,
    });
    expect(submitted).toHaveBeenCalledWith('https://rt.sizpay.ir/Route/Payment', {
      MerchantID: '123', TerminalID: '456', Token: 'test-token',
    });
  } finally {
    await act(async () => root.unmount());
    submit.mockRestore();
  }
});
