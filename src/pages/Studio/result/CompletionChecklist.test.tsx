// @vitest-environment jsdom
import { act, useState } from 'react';
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
  expect(host.textContent).toContain('خودم تهیه می‌کنم');
  expect(host.textContent).toContain('هما پیگیری کند');
  expect(select).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});


it('keeps self-sourcing separate from Homa follow-up, with undo and reload persistence', async () => {
  sessionStorage.clear();
  const host = document.createElement('div'); const root = createRoot(host);
  let changes = 0;
  const items = [{ id: 55, name: 'پرده', category: 'curtain', imageUrl: '', aiReasoning: 'دلیل اصلی', specifications: ['رنگ شیری'] }];
  function Harness() {
    const [checked, setChecked] = useState(new Set<number>());
    return <CompletionChecklist sessionId="sourcing-regression" items={items} checkedIds={checked} onToggleItem={id => { changes++; setChecked(previous => previous.has(id) ? new Set() : new Set([id])); }} />;
  }
  await act(async () => root.render(<Harness />));
  const click = async (name: string) => act(async () => [...host.querySelectorAll('button')].find(button => button.textContent?.includes(name))!.click());
  expect(changes).toBe(0); expect(host.textContent).toContain('رنگ شیری');
  await click('خودم تهیه می‌کنم'); expect(changes).toBe(0); expect(host.textContent).toContain('لغو تهیهٔ شخصی');
  await click('هما پیگیری کند'); expect(changes).toBe(1); expect(host.textContent).toContain('لغو پیگیری هما'); expect(host.textContent).toContain('خودم تهیه می‌کنم');
  await click('خودم تهیه می‌کنم'); expect(changes).toBe(2); expect(host.textContent).toContain('لغو تهیهٔ شخصی');
  await act(async () => root.unmount());
  const next = createRoot(host); await act(async () => next.render(<Harness />));
  expect(host.textContent).toContain('لغو تهیهٔ شخصی');
  await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent?.includes('لغو تهیهٔ شخصی'))!.click());
  expect(host.textContent).toContain('خودم تهیه می‌کنم');
  await act(async () => next.unmount());
});
