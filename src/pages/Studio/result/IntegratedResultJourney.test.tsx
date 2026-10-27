// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioResultView } from '../ResultPage';
import { useConversationStudioResult } from '../../RoomRedesign/hooks/useConversationStudioResult';
import type { ExecutionPlan } from '../../RoomRedesign/services/redesignChatService';
import type { JourneyFinding } from '../../RoomRedesign/services/resultJourney';

vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (text: string) => text, siteValue: (value: unknown) => value, siteDirection: () => 'rtl' }), siteText: (text: string) => text }));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key, i18n: { language: 'fa', dir: () => 'rtl' } }) }));
vi.mock('../../RoomRedesign/components/workspace', () => ({ useImageActions: () => ({}) }));
const basket = vi.hoisted(() => ({ basket: { shop_groups: [] }, addItem: vi.fn(), openBasket: vi.fn() }));
vi.mock('@/context/BasketContext', () => ({ useBasket: () => basket }));
const plan: ExecutionPlan = { purchases: [{ item_id: 'rug', quantity: 1, category: 'rug', reason_fa: 'دلیل واقعی فرش', relation: 'similar', product: { product_id: 7, name: 'فرش اصلی', price_rial: 100, unique_link: 'rug-7' }, alternatives: [{ product_id: 8, name: 'فرش جایگزین', price_rial: 200, unique_link: 'rug-8' }] }], free_actions: [], surface_actions: [], known_subtotal_rial: 100, budget_ceiling_toman: null, budget_status: 'complete', unknown_cost_item_ids: [] };
let counter = 0;
let cleanup: (() => Promise<void>) | undefined;
beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
});
afterEach(async () => { await cleanup?.(); cleanup = undefined; vi.useRealTimers(); vi.unstubAllGlobals(); });
async function mount(count: number, key = `journey-test-${++counter}`) {
  const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
  const findings: JourneyFinding[] = Array.from({ length: count }, (_, index) => ({ id: `decision-${index}`, title: `تصمیم ${index + 1}`, kind: index ? 'add' : 'keep', before: `شاهد ${index + 1}`, recommendation: `پیشنهاد ${index + 1}`, reason: `دلیل ${index + 1}` }));
  function Harness() {
    const state = useConversationStudioResult({ plan, sessionId: key, versionId: 'current', resultImage: 'after.jpg', originalImage: 'before.jpg', showOriginal: false, onToggleOriginal: vi.fn(), onOpenChat: vi.fn() });
    return <StudioResultView state={state} journey={{ key, start: true, findings }} />;
  }
  const render = async () => act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>));
  await render();
  cleanup = async () => { await act(async () => root.unmount()); host.remove(); };
  return { host, render, key };
}
async function click(text: string, scope: ParentNode = document) {
  const button = [...scope.querySelectorAll('button')].find(element => element.textContent?.trim() === text)!;
  expect(button).toBeTruthy(); await act(async () => button.click());
  await act(async () => vi.advanceTimersByTime(0));
}
const finishReveal = async () => act(async () => vi.advanceTimersByTime(4800));
const recommendationsActive = (host: HTMLElement) => {
  expect(host.querySelector('#section-products')?.hasAttribute('hidden')).toBe(false);
  expect(host.querySelector('.studio-summary button[aria-current="step"]')?.textContent).toContain('پیشنهاد');
  expect(document.querySelector('.homa-analysis-sheet')).toBeNull();
};
describe('integrated result journey in the existing result page', () => {
  it.each([1, 3, 7])('shows %i genuine decisions sequentially and rests on recommendations', async count => {
    const ui = await mount(count);
    expect(ui.host.querySelector('.homa-result-reveal img')?.getAttribute('src')).toBe('before.jpg');
    expect(ui.host.querySelector('.homa-result-reveal-after img')?.getAttribute('src')).toBe('after.jpg');
    await finishReveal();
    for (let index = 0; index < count; index++) {
      expect(document.querySelector('.homa-analysis-sheet h2')?.textContent).toBe(`تصمیم ${index + 1}`);
      expect(document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toBe(String(index + 1));
      expect(document.querySelector('.homa-analysis-sheet')?.textContent).toContain(`شاهد ${index + 1}`);
      await click(index === count - 1 ? 'دیدن پیشنهادهای محصول←' : 'تحلیل بعدی←');
    }
    recommendationsActive(ui.host);
    expect(ui.host.querySelector('.homa-result-reveal')).toBeNull();
    await ui.render(); await act(async () => vi.advanceTimersByTime(30000)); recommendationsActive(ui.host);
    expect(basket.addItem).not.toHaveBeenCalled();
  });
  it('skip and Escape both close the guide onto recommendations', async () => {
    const ui = await mount(3); await finishReveal();
    await click('تحلیل بعدی←'); await click('قبلی');
    expect(document.querySelector('.homa-analysis-sheet h2')?.textContent).toBe('تصمیم 1');
    await click('رد کردن'); recommendationsActive(ui.host);
    const analysis = ui.host.querySelector<HTMLButtonElement>('.studio-summary button')!;
    await act(async () => analysis.click());
    await click('مرور مرحله‌به‌مرحلهٔ تصمیم‌های طراحی');
    expect(document.querySelector('[role=dialog]')?.getAttribute('aria-modal')).toBe('true');
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    await act(async () => vi.advanceTimersByTime(0)); recommendationsActive(ui.host);
  });
  it('does not reopen on reload and handles zero analyses without an empty modal', async () => {
    const ui = await mount(0); await finishReveal(); recommendationsActive(ui.host);
    const key = ui.key; await cleanup?.(); cleanup = undefined;
    const reloaded = await mount(3, key);
    expect(reloaded.host.querySelector('.homa-result-reveal')).toBeNull(); recommendationsActive(reloaded.host);
  });
  it('reduced motion goes promptly to real analysis without a lengthy reveal', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    const ui = await mount(1);
    expect(ui.host.querySelector('.homa-result-reveal')).toBeNull(); expect(document.querySelector('.homa-analysis-sheet')).not.toBeNull();
    await click('رد کردن'); recommendationsActive(ui.host);
  });
});
