// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { expect, it } from 'vitest';
import { createPublicI18n } from '@/seo/i18n';
import { HomeNavigation } from './HomeNavigation';

it('opens the homepage menu with its links and restores focus when dismissed', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () => root.render(
      <I18nextProvider i18n={createPublicI18n()}><HomeNavigation /></I18nextProvider>,
    ));
    const trigger = host.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
    trigger.focus();
    await act(async () => trigger.click());
    const menu = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(menu.dir).toBe('rtl');
    expect(menu.querySelector('a[href="#design-steps"]')).toBeTruthy();
    expect(menu.querySelector('a[href="#pricing"]')?.textContent).toBe('تعرفه‌ها');
    expect(menu.querySelector('a[href="/studio"]')).toBeTruthy();
    expect(menu.querySelector('a[href="/basket"]')).toBeTruthy();

    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
