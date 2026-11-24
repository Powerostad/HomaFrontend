// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { expect, it } from 'vitest';
import { createPublicI18n } from '@/seo/i18n';
import { HomeStudioExample } from './HomeStudioExample';

it('connects photo markers to real product cards and opens the complete shopping selection', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  try {
    await act(async () => root.render(
      <I18nextProvider i18n={createPublicI18n()}><HomeStudioExample /></I18nextProvider>,
    ));
    const markers = host.querySelectorAll<HTMLButtonElement>('.ds-hotspot');
    const products = host.querySelectorAll<HTMLAnchorElement>('.ds-floating-products a');
    expect(markers).toHaveLength(4);
    expect(products).toHaveLength(4);
    await act(async () => markers[0].click());
    expect(document.activeElement).toBe(products[0]);
    await act(async () => host.querySelector<HTMLButtonElement>('.ds-shop-button')!.click());
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    expect(Array.from(dialog.querySelectorAll<HTMLElement>('.ds-product'), card => card.dataset.product))
      .toEqual(['1616', '77', '42', 'magallery-pottery-lamp', '1660']);
    for (const link of dialog.querySelectorAll<HTMLAnchorElement>('.ds-product')) {
      expect(link.href).toMatch(/^https:\/\/(parshook\.com|www\.digikala\.com|decormair\.com|magallery\.ir)\//);
      expect(link.rel).toContain('noopener');
    }
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
