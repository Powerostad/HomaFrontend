// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import '@/i18n/config';
import StudioPaymentDemo from './StudioPaymentDemo';

vi.mock('@/components/Header', () => ({ Header: () => null }));

it('returns to the same draft for each outcome and spends credits only on delivery', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  sessionStorage.clear();
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  let currentUrl = '';
  function Checkout() {
    currentUrl = useLocation().search;
    return <StudioPaymentDemo />;
  }
  let sampleImage: HTMLImageElement;
  vi.stubGlobal('Image', class {
    constructor() {
      sampleImage = document.createElement('img');
      return sampleImage;
    }
  });
  const click = async (label: string) => {
    const button = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(label));
    expect(button, label).toBeDefined();
    await act(async () => button!.click());
  };
  const balance = () => container.querySelector('[role=status]')?.textContent;
  const expected = (num: number) => new Intl.NumberFormat('fa-IR').format(num);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={['/studio?creditDemo=1']}><Checkout /></MemoryRouter>));
    const draft = container.querySelector('textarea');
    expect(draft).toBeTruthy();
    expect(balance()).toContain(expected(0));

    await click('خرید آزمایشی');
    expect(currentUrl).toContain('demoOrder=');
    await click('شبیه‌سازی پرداخت ناموفق');
    expect(balance()).toContain('ناموفق');
    expect(balance()).toContain(expected(0));

    await click('خرید آزمایشی');
    await click('انصراف و بازگشت');
    expect(balance()).toContain('لغو شد');
    expect(container.querySelector('textarea')).toBe(draft);

    await click('خرید آزمایشی');
    await click('شبیه‌سازی پرداخت موفق');
    expect(balance()).toContain('اضافه شد');
    expect(balance()).toContain(expected(10));
    expect(currentUrl).toBe('?creditDemo=1');
    expect(container.querySelector('textarea')).toBe(draft);

    await click('ساخت طرح نمونه');
    expect(balance()).toContain(expected(10));
    await act(async () => { sampleImage.dispatchEvent(new Event('error')); });
    expect(balance()).toContain(expected(10));
    await click('ساخت طرح نمونه');
    await act(async () => { sampleImage.dispatchEvent(new Event('load')); });
    expect(balance()).toContain(expected(8));
    expect(container.querySelector('img[src$="cabin-after.webp"]')).toBeTruthy();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  }
});
