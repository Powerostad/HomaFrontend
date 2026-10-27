// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignEditIntro, DESIGN_EDIT_INTRO_STORAGE_KEY } from './DesignEditIntro';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));
let remove: (() => Promise<void>) | undefined;
beforeEach(() => {
  localStorage.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(async () => { await remove?.(); remove = undefined; });
async function renderIntro(onOpenChat = vi.fn()) {
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<DesignEditIntro onOpenChat={onOpenChat} />));
  remove = async () => { await act(async () => root.unmount()); host.remove(); };
  return { host, onOpenChat };
}
describe('first-use design edit introduction', () => {
  it('explains the capability and only opens the existing chat on explicit action', async () => {
    const { host, onOpenChat } = await renderIntro();
    expect(host.textContent).toContain('می‌تونی این طراحی رو دقیق‌تر کنی');
    expect(onOpenChat).not.toHaveBeenCalled();
    const action = Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'اصلاح طرح');
    expect(action).toBeTruthy();
    await act(async () => action!.click());
    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(DESIGN_EDIT_INTRO_STORAGE_KEY)).toBe('seen');
    expect(host.querySelector('.studio-edit-intro')).toBeNull();
  });
  it('can be dismissed; never reappears once seen in the browser', async () => {
    const { host } = await renderIntro();
    await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'بعداً')!.click());
    expect(localStorage.getItem(DESIGN_EDIT_INTRO_STORAGE_KEY)).toBe('seen');
    await remove?.(); remove = undefined;
    const again = await renderIntro();
    expect(again.host.querySelector('.studio-edit-intro')).toBeNull();
  });
});
