// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { CompletionChecklist } from './CompletionChecklist';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({
  siteText: (text: string) => text, siteValue: (text: string) => text, siteDirection: () => 'rtl',
}) }));

it('shows the designer brief and encoded search link without claiming a completed image or stock', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const select = vi.fn();
  await act(async () => root.render(<CompletionChecklist items={[{
    id: 1, name: 'پرده', category: 'drapery_panel', imageUrl: '',
    aiReasoning: 'برای نرم شدن نور، پرده کتانی کرم را کنار پنجره نصب کنید.', webSearchQuery: 'پرده کتانی کرم',
  }]} checkedIds={new Set()} onToggleItem={select} />));
  expect(host.textContent).toContain('کنار پنجره');
  expect(host.textContent).toContain('عبارت پیشنهادی برای جست‌وجو');
  expect(host.querySelector('a')?.href).toBe('https://www.google.com/search?q=' + encodeURIComponent('پرده کتانی کرم'));
  expect(host.textContent).not.toContain('در تصویر طراحی شما دیده');
  expect(select).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});
