// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(apiGet).mockReset();
  vi.mocked(apiPost).mockReset();
});

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

describe('API-PAYMENT — checkout and receipt recovery', () => {
  let root: Root;
  let host: HTMLDivElement;
  const offer = { code: 'small', price_irr: 120_000, credits: 2, balance: 1 };
  const mount = async (url = '/studio') => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root.render(
      <MemoryRouter initialEntries={[url]}><StudioCreditPurchase /></MemoryRouter>
    ));
  };
  beforeEach(() => { vi.mocked(apiGet).mockResolvedValue({ success: true, data: offer }); });
  afterEach(async () => {
    if (root) await act(async () => root.unmount());
    host?.remove();
    vi.restoreAllMocks();
  });

  it('sends a single checkout when the user clicks twice while the request is pending', async () => {
    let finish!: (result: Awaited<ReturnType<typeof apiPost>>) => void;
    vi.mocked(apiPost).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    await mount();
    await act(async () => { host.querySelector('button')!.click(); host.querySelector('button')!.click(); });
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(host.querySelector('button')?.disabled).toBe(true);
    await act(async () => finish({ success: false, statusCode: 503 }));
    expect(host.querySelector('button')?.disabled).toBe(false);
    expect(host.querySelector('[role=alert]')).toBeTruthy();
  });

  it('refreshes a changed offer and requires a new user confirmation', async () => {
    vi.mocked(apiPost).mockResolvedValue({ success: false, statusCode: 409 });
    await mount();
    vi.mocked(apiGet).mockResolvedValue({ success: true, data: { ...offer, price_irr: 200_000, credits: 3 } });
    await act(async () => host.querySelector('button')!.click());
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenLastCalledWith('/payments/sizpay/offer/');
    expect(host.textContent).toContain('20,000 تومان');
    expect(host.querySelector('[role=alert]')?.textContent).toContain('مشخصات بسته تغییر کرده');
    expect(host.querySelector('button')?.disabled).toBe(false);
  });

  it('rejects a gateway address outside the allowed Sizpay endpoint', async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    vi.mocked(apiPost).mockResolvedValue({ success: true, data: { action: 'https://untrusted.example/pay', fields: {} } });
    await mount();
    await act(async () => host.querySelector('button')!.click());
    expect(submit).not.toHaveBeenCalled();
    expect(host.querySelector('[role=alert]')).toBeTruthy();
  });

  it.each(['cancelled', 'pending', 'failed'])('does not claim credits for a %s server receipt', async status => {
    vi.mocked(apiGet).mockImplementation(async endpoint => ({
      success: true, data: endpoint.includes('/status/') ? { status, credits: 0 } : offer,
    }));
    const purchase = '12345678-abcd-abcd-abcd-123456789abc';
    await mount('/studio?creditPurchase=' + purchase);
    expect(apiGet).toHaveBeenCalledWith('/payments/sizpay/status/' + purchase + '/', undefined, expect.any(Object));
    expect(host.querySelector('[role=status]')?.textContent).toContain('پرداخت تأیید نشده');
    expect(host.textContent).not.toContain('اعتبار به حساب اضافه شد');
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('shows a paid receipt only after the server confirms it', async () => {
    vi.mocked(apiGet).mockImplementation(async endpoint => ({
      success: true, data: endpoint.includes('/status/') ? { status: 'paid', credits: 2, balance: 3 } : offer,
    }));
    await mount('/studio?creditPurchase=12345678-abcd-abcd-abcd-123456789abc');
    expect(host.querySelector('[role=status]')?.textContent).toContain('2 اعتبار به حساب اضافه شد');
    expect(host.textContent).toContain('موجودی اعتبار: 3');
    expect(apiPost).not.toHaveBeenCalled();
  });
});
