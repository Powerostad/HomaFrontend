// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomRedesignPage } from './RoomRedesignPage';
import type { ExecutionPlan } from './services/redesignChatService';

vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/context/BasketContext', () => ({ useBasket: () => ({ basket: { shop_groups: [] }, totalRial: 0, itemCount: 0, openBasket: vi.fn(), addItem: vi.fn() }) }));
vi.mock('./components/SessionDiagnostics', () => ({ SessionDiagnostics: () => null }));
vi.mock('./components/PerformancePanel', () => ({ PerformancePanel: () => <div>Performance report</div> }));
vi.mock('./components/workspace', () => ({ useImageActions: () => ({ modals: null }) }));
vi.mock('../Studio/result/HeroImagePanel', () => ({ DesktopHeroPanel: ({ resultImage, showOriginal }: { resultImage: string; showOriginal: boolean }) => <div data-testid="hero" data-result={resultImage} data-original={showOriginal}>Original hero</div>, MobileHeroSection: () => null }));
vi.mock('../Studio/components/ProductDetailSheet', () => ({ ProductDetailSheet: ({ onPreview }: { onPreview?: () => void }) => <div><button onClick={onPreview}>Preview lamp</button></div> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value, siteText: (value: string) => value, siteDirection: () => 'rtl' }), siteText: (value: string) => value }));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ t: (key: string) => key, i18n: { dir: () => 'rtl', language: 'fa' } }) }));
const testState = vi.hoisted(() => ({ failed: false, send: vi.fn(async () => true) }));
const fixturePlan = vi.hoisted((): ExecutionPlan => ({ purchases: [{ item_id: 'lamp', category: 'Lighting', quantity: 1, reason_fa: 'Canonical report', relation: 'similar', alternatives: [], product: { product_id: 7, name: 'Lamp', price_rial: 100000, image_url: '', unique_link: 'lamp' } }], free_actions: [], surface_actions: [], known_subtotal_rial: 100000, unknown_cost_item_ids: [], budget_ceiling_toman: null, budget_status: 'complete' }));
vi.mock('./hooks/useRedesignChat', () => ({ useRedesignChat: () => ({ sessionId: 'saved', messages: [], chipGroups: [],
  versions: testState.failed ? [] : [{ version_id: 'v1', image_url: 'render.jpg', execution: fixturePlan }],
  currentExecution: fixturePlan,
  originalImage: 'photo.jpg', selectedVersion: undefined, viewedId: 'original', busy: false,
  error: testState.failed ? 'Image failed' : null, status: 'idle', selectVersion: vi.fn(), sendTurn: testState.send, selectChip: vi.fn() }) }));

async function mount() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<MemoryRouter initialEntries={['/studio/chat/saved']}><Routes><Route path="/studio/chat/:sessionId" element={<RoomRedesignPage />} /></Routes></MemoryRouter>));
  return { container, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}

describe('original Studio result flow with conversation', () => {
  it('keeps services and free layout changes out of product cards, sourcing and the shopping invoice', async () => {
    fixturePlan.free_actions = [{ instruction_fa: 'Move sofa', reason_fa: 'Clear walkway' }];
    fixturePlan.surface_actions = [{ change_fa: 'Paint wall' }];
    const ui = await mount();
    try {
      expect(ui.container.querySelector('.studio-tier-section')?.textContent).not.toContain('Paint wall');
      expect(ui.container.querySelector('[aria-labelledby="studio-layout-title"]')?.textContent).toContain('Move sofa');
      expect(ui.container.querySelector('[aria-labelledby="studio-services-title"]')?.textContent).toContain('Paint wall');
      expect(ui.container.querySelector('[aria-label="تکمیل پازل چیدمان"]')).toBeNull();
      const service = ui.container.querySelector<HTMLButtonElement>('[aria-labelledby="studio-services-title"] button[aria-pressed]')!;
      await act(async () => service.click());
      expect(service.getAttribute('aria-pressed')).toBe('true');
      expect(ui.container.querySelector('.studio-invoice')?.textContent).not.toContain('Paint wall');
      expect(ui.container.querySelector('.studio-invoice')?.textContent).toContain('هنوز محصولی انتخاب نکردید');
    } finally { await ui.cleanup(); fixturePlan.free_actions = []; fixturePlan.surface_actions = []; }
  });
  beforeEach(() => { sessionStorage.clear(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
  it('preserves the generated image behind the original-image comparison', async () => {
    const ui = await mount();
    try {
      expect(ui.container.querySelector('[data-testid=hero]')?.getAttribute('data-result')).toBe('render.jpg');
      expect(ui.container.querySelector('[data-testid=hero]')?.getAttribute('data-original')).toBe('true');
    } finally { await ui.cleanup(); }
  });
  it('keeps the analysis and products available when image generation failed', async () => {
    testState.failed = true;
    const ui = await mount();
    try {
      expect(ui.container.textContent).toContain('Canonical report');
      expect(ui.container.textContent).toContain('Image failed');
      expect(ui.container.querySelector('.studio-impact-card')).not.toBeNull();
      expect(ui.container.querySelector('.studio-tier-section')).not.toBeNull();
      expect(ui.container.querySelector('.studio-invoice')).not.toBeNull();
      expect(ui.container.querySelector('.studio-flow-content')).toBeNull();
      expect(document.querySelector('[role=dialog]')).toBeNull();
    } finally { await ui.cleanup(); testState.failed = false; }
  });
  it('opens one drawer, preserves an unsent draft, and closes without sending', async () => {
    testState.send.mockClear();
    const ui = await mount();
    try {
      const trigger = ui.container.querySelector<HTMLButtonElement>('.studio-result-version-row button')!;
      await act(async () => trigger.click());
      expect(document.querySelectorAll('textarea')).toHaveLength(1);
      const input = document.querySelector<HTMLTextAreaElement>('#studio-message')!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input, 'Unsent draft');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => document.querySelector<HTMLButtonElement>('.studio-conversation-drawer-heading button')!.click());
      expect(document.querySelector('[role=dialog]')).toBeNull();
      await act(async () => trigger.click());
      expect(document.querySelector<HTMLTextAreaElement>('#studio-message')!.value).toBe('Unsent draft');
      expect(testState.send).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('only an explicit preview sends the selected item/product, without fabricated text', async () => {
    testState.send.mockClear();
    const ui = await mount();
    try {
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-product-image-button')!.click());
      await act(async () => Array.from(ui.container.querySelectorAll('button')).find(button => button.textContent === 'Preview lamp')!.click());
      expect(testState.send).toHaveBeenCalledExactlyOnceWith({ text: '', action: 'preview_product', itemId: 'lamp', productId: 7 });
      expect(document.querySelector('[role=dialog]')).not.toBeNull();
    } finally { await ui.cleanup(); }
  });
});
