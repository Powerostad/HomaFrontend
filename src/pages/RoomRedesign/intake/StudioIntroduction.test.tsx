// @vitest-environment jsdom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n/config';
import { StudioStartPage } from './StudioStartPage';

const auth = vi.hoisted(() => ({ isInitialized: true, user: null as null | { id: string } }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ ...auth, isLoggedIn: !!auth.user }) }));
vi.mock('@/components/AuthModal', () => ({ AuthModal: () => null }));
vi.mock('./StudioIntake', () => ({ StudioIntake: ({ introduction }: { introduction: ReactNode }) =>
  <main>{introduction}<input aria-label="draft" /></main> }));
vi.mock('../RoomRedesignPage', () => ({ RoomRedesignPage: () => null }));

let root: Root, container: HTMLDivElement;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  sessionStorage.clear();
  localStorage.clear();
  auth.isInitialized = true;
  auth.user = null;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const mount = async (url: string) => act(async () => root.render(
  <MemoryRouter initialEntries={[url]}><StudioStartPage /></MemoryRouter>
));
const click = async (selector: string) => {
  const element = document.querySelector<HTMLElement>(selector);
  expect(element, selector).toBeTruthy();
  await act(async () => element!.click());
};
describe('studio introduction', () => {
  it('walks through comparison, a change plan, product previews and consultation in the same modal', async () => {
    await mount('/studio');
    const dialog = document.querySelector('[role=dialog]')!;
    expect(dialog.querySelector('h2')?.textContent).toContain('هر خونه‌ای');
    expect(dialog.querySelector('form, input:not([type=range]), textarea')).toBeNull();
    expect(dialog.querySelector('input[type=range]')?.getAttribute('value')).toBe('50');
    expect(dialog.querySelector('img[src$="cabin-before.webp"]')).toBeTruthy();
    await act(async () => { dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })); });
    expect(document.querySelector('[role=dialog]')).toBe(dialog);
    expect(dialog.querySelectorAll('.sg-plan dt')).toHaveLength(3);
    expect(dialog.querySelector('h2')).toBe(document.activeElement);
    await click('.studio-guide-start');
    expect(dialog.querySelector('figure img')?.getAttribute('src')).toContain('cabin-after');
    expect(dialog.querySelectorAll('.sg-product')).toHaveLength(3);
    expect(dialog.querySelector('.sg-rug-preview')).toBeNull();
    await click('.sg-products li:first-child button');
    expect(dialog.querySelector('.sg-rug-preview')).toBeTruthy();
    expect(dialog.querySelector('.sg-seller')?.getAttribute('href')).toContain('zardaan.com');
    await click('.sg-products li:nth-child(2) button');
    expect(dialog.querySelector('.sg-rug-preview')).toBeNull();
    expect(dialog.querySelector('.sg-pin-curtain')?.getAttribute('data-active')).toBe('true');
    await click('.studio-guide-start');
    expect(dialog.querySelector('.sg-chat')?.textContent).toContain('درخواست مشاوره رو ثبت کن');
    await click('.sg-topics button:last-child');
    expect(dialog.querySelector('.sg-chat')?.textContent).toContain('خرید بعدی');
    expect(dialog.querySelector('.sg-credit')?.textContent).toContain('اعتبار');
    await click('.studio-guide-back');
    expect(dialog.querySelector('.sg-products')).toBeTruthy();
    await click('.studio-guide-start');
    await click('.studio-guide-start');
    expect(document.querySelector('[role=dialog]')).toBeNull();
    const draft = container.querySelector('input')!;
    draft.value = 'keep my furniture';
    await click('.studio-guide-link');
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(container.querySelector('input')?.value).toBe('keep my furniture');
  });
  it('can skip straight to intake and reopen at the first chapter', async () => {
    await mount('/studio');
    await click('.studio-guide-start');
    await click('.studio-guide-skip');
    expect(document.querySelector('[role=dialog]')).toBeNull();
    await click('.studio-guide-link');
    expect(document.querySelector('[role=dialog] h2')?.textContent).toContain('هر خونه‌ای');
  });
  it('keeps the introduction available on subsequent visits without interrupting the draft', async () => {
    sessionStorage.setItem('homa.studio.introduction.v4.seen', 'yes');
    await mount('/studio');
    expect(document.querySelector('[role=dialog]')).toBeNull();
    await click('.studio-guide-link');
    expect(document.querySelector('[role=dialog]')).toBeTruthy();
  });
  it('shows the guide on first room entry for each restored account independently', async () => {
    const url = '/studio?room=bedroom';
    auth.isInitialized = false;
    sessionStorage.setItem('homa.studio.introduction.v4.seen', 'yes');
    await mount(url);
    expect(document.querySelector('[role=dialog]')).toBeNull();
    auth.isInitialized = true;
    auth.user = { id: 'first' };
    await mount(url);
    await click('.studio-guide-skip');
    auth.user = { id: 'second' };
    await mount(url);
    await click('.studio-guide-skip');
    auth.user = { id: 'first' };
    sessionStorage.clear();
    await mount(url);
    expect(document.querySelector('[role=dialog]')).toBeNull();
    await click('.studio-guide-link');
    expect(document.querySelector('[role=dialog]')).toBeTruthy();
  });
  it.each(['/studio?view=design', '/studio?creditPurchase=receipt'])('respects directed entry %s', async url => {
    await mount(url);
    expect(document.querySelector('[role=dialog]')).toBeNull();
    expect(container.querySelector('input')).toBeTruthy();
  });
});
