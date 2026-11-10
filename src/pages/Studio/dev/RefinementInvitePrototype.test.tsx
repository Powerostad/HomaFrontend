// @vitest-environment jsdom
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createInstance } from 'i18next';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { RefinementInvitePrototype, RefinementPrototypeShell } from './RefinementInvitePrototype';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (value: string) => value }) }));

describe('preview-only design refinement invitation', () => {
  it('opens an editable draft from an example without sending it', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const send = vi.fn();
    const node = document.createElement('div'); const root = createRoot(node);
    function Harness() {
      const [draft, setDraft] = useState(''); const [open, setOpen] = useState(false);
      return <><RefinementInvitePrototype onStart={text => { if (text !== undefined) setDraft(text); setOpen(true); }} />
        {open && <div role="dialog"><textarea value={draft} onChange={event => setDraft(event.target.value)} />
          <button onClick={() => send(draft)}>ارسال</button><button onClick={() => setOpen(false)}>بستن</button></div>}</>;
    }
    try {
      await act(async () => root.render(<Harness />));
      const examples = node.querySelectorAll<HTMLButtonElement>('.studio-refinement-examples button');
      expect(examples).toHaveLength(3);
      await act(async () => examples[0].click());
      const input = node.querySelector('textarea')!;
      expect(input.value).toContain('رنگ پرده روشن‌تر');
      expect(send).not.toHaveBeenCalled();
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, 'پرده شیری باشه');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => node.querySelectorAll<HTMLButtonElement>('[role=dialog] button')[1].click());
      await act(async () => node.querySelector<HTMLButtonElement>('.studio-refinement-entry')!.click());
      expect(node.querySelector('textarea')!.value).toBe('پرده شیری باشه');
      expect(send).not.toHaveBeenCalled();
      await act(async () => node.querySelector<HTMLButtonElement>('[role=dialog] button')!.click());
      expect(send).toHaveBeenCalledExactlyOnceWith('پرده شیری باشه');
    } finally { await act(async () => root.unmount()); }
  });

  it('renames the preview navigation without modifying the shared translation resources', async () => {
    const instance = createInstance();
    await instance.init({ lng: 'fa', resources: { fa: { translation: { studioWorkspace: { conversation: 'گفتگو' } } } } });
    const node = document.createElement('div'); const root = createRoot(node);
    function Label() { const { t } = useTranslation(); return <span>{t('studioWorkspace.conversation')}</span>; }
    try {
      await act(async () => root.render(<I18nextProvider i18n={instance}><RefinementPrototypeShell><Label /></RefinementPrototypeShell><Label /></I18nextProvider>));
      expect(node.querySelector('.studio-refinement-prototype')?.textContent).toBe('اصلاح طرح');
      expect(node.lastElementChild?.textContent).toBe('گفتگو');
      expect(instance.t('studioWorkspace.conversation')).toBe('گفتگو');
    } finally { await act(async () => root.unmount()); }
  });
});
