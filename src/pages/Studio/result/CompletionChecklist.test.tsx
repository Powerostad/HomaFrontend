// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { CompletionChecklist } from './CompletionChecklist';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({
  siteText: (text: string) => text, siteValue: (text: string) => text, siteDirection: () => 'rtl',
}) }));

it('uses the server sourcing display with the designer reason, consultation and search link', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const select = vi.fn();
  await act(async () => root.render(<CompletionChecklist items={[{
    id: 1, name: 'پرده', category: 'drapery_panel', imageUrl: '',
    aiReasoning: 'برای نرم شدن نور، پرده کتانی کرم را کنار پنجره نصب کنید.', webSearchQuery: 'پرده کتانی کرم',
  }]} checkedIds={new Set()} onToggleItem={select} />));
  expect(host.textContent).toContain('کنار پنجره');
  expect(host.textContent).not.toContain('عبارت پیشنهادی برای جست‌وجو');
  expect(host.querySelector('a')?.href).toBe('https://www.google.com/search?q=' + encodeURIComponent('پرده کتانی کرم'));
  expect(host.textContent).toContain('در تصویر طراحی شما دیده');
  expect(host.textContent).toContain('می‌خوام تهیه کنم');
  expect(select).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});
