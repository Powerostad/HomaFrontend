// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomRedesignPage } from './RoomRedesignPage';
import type { ExecutionPlan } from './services/redesignChatService';

vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/context/BasketContext', () => ({ useBasket: () => ({ basket: { shop_groups: [] }, totalRial: 0, itemCount: 0, openBasket: vi.fn(), addItem: vi.fn() }) }));
vi.mock('./components/SessionDiagnostics', () => ({ SessionDiagnostics: () => <section data-testid="unified-report">Unified report</section> }));
vi.mock('./components/PerformancePanel', () => ({ PerformancePanel: () => <div>Performance report</div> }));
vi.mock('./components/workspace', () => ({ useImageActions: () => ({ modals: null }) }));
vi.mock('../Studio/result/HeroImagePanel', () => ({ DesktopHeroPanel: ({ resultImage, showOriginal, onToggleOriginal }: { resultImage: string; showOriginal: boolean; onToggleOriginal: (show: boolean) => void }) => <div data-testid="hero" data-result={resultImage} data-original={showOriginal}><button onClick={() => onToggleOriginal(!showOriginal)}>Toggle comparison</button></div>, MobileHeroSection: () => null }));
vi.mock('../Studio/components/ProductDetailSheet', () => ({ ProductDetailSheet: ({ onPreview }: { onPreview?: () => void }) => <div><button onClick={onPreview}>Preview lamp</button></div> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value, siteText: (value: string) => value, siteDirection: () => 'rtl', siteLocale: () => 'fa-IR' }), siteText: (value: string) => value }));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ t: (key: string) => key, i18n: { dir: () => 'rtl', language: 'fa' } }) }));
const testState = vi.hoisted(() => ({ failed: false, processing: false, starting: false, send: vi.fn(async () => true) }));
const fixturePlan = vi.hoisted((): ExecutionPlan => ({ purchases: [{ item_id: 'lamp', category: 'Lighting', quantity: 1, reason_fa: 'Canonical report', relation: 'similar', alternatives: [], product: { product_id: 7, name: 'Lamp', price_rial: 100000, image_url: '', unique_link: 'lamp' } }], free_actions: [], surface_actions: [], known_subtotal_rial: 100000, unknown_cost_item_ids: [], budget_ceiling_toman: null, budget_status: 'complete' }));
vi.mock('./hooks/useRedesignChat', () => ({ useRedesignChat: () => ({ sessionId: testState.starting ? null : 'saved', messages: [], chipGroups: [],
  versions: testState.failed || testState.processing || testState.starting ? [] : [{ version_id: 'v1', image_url: 'render.jpg', execution: fixturePlan }],
  currentExecution: testState.starting ? null : fixturePlan,
  originalImage: testState.starting ? null : 'photo.jpg', selectedVersion: undefined, viewedId: 'original', busy: testState.processing,
  error: testState.failed ? 'Image failed' : null, status: 'idle', selectVersion: vi.fn(), sendTurn: testState.send, selectChip: vi.fn() }) }));

async function mount() {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  const render = async () => act(async () => root.render(<MemoryRouter initialEntries={['/studio/chat/saved']}><Routes><Route path="/studio/chat/:sessionId" element={<RoomRedesignPage />} /></Routes></MemoryRouter>));
  await render();
  return { container, render, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}

describe('original Studio result flow with conversation', () => {
  it('shows the ready reveal on completion and focuses the existing result after entering it', async () => {
    testState.processing = true;
    const ui = await mount();
    try {
      expect(ui.container.querySelector('.homa-loading-page')).not.toBeNull();
      testState.processing = false;
      await ui.render();
      expect(document.querySelector('.homa-result-reveal')).not.toBeNull();
      expect(ui.container.querySelector('.homa-loading-page')).toBeNull();
      const result = ui.container.querySelector('.studio-result-arrival');
      expect(result).not.toBeNull();
      expect(document.activeElement).toBe(result?.querySelector('h1'));
      expect(testState.send).not.toHaveBeenCalled();
    } finally { testState.processing = false; await ui.cleanup(); }
  });
  it('opens sample inspiration after intake and keeps the private photo hidden until analysis', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    testState.starting = true; testState.send.mockClear();
    const container = document.createElement('div'), root = createRoot(container);
    try {
      await act(async () => root.render(<MemoryRouter initialEntries={['/studio']}><Routes><Route path="/studio" element={<RoomRedesignPage initialIntake={{ image: { dataUrl: 'data:image/jpeg;base64,original', width: 1200, height: 900, source: 'gallery' }, goals: [], createdAt: 'now' }} />} /></Routes></MemoryRouter>));
      expect(container.querySelector('.homa-loading-screen[data-moment=comparison]')).not.toBeNull();
      expect(container.querySelector('[src="data:image/jpeg;base64,original"]')).toBeNull();
      expect(container.querySelector('.studio-invoice')).toBeNull();
    } finally { await act(async () => root.unmount()); testState.starting = false; testState.send.mockClear(); }
  });
  it('keeps product feedback in the main card disclosure and product details readable', async () => {
    const ui = await mount();
    try {
      const card = ui.container.querySelector<HTMLElement>('.studio-product-preview')!;
      expect(card.dir).toBe('rtl');
      const decision = ui.container.querySelector<HTMLDetailsElement>('.studio-v9-design-decision')!;
      expect(decision.open).toBe(false);
      await act(async () => decision.querySelector('summary')!.click());
      expect(decision.open).toBe(true);
      const feedback = decision.querySelector<HTMLButtonElement>('.studio-product-refinement > button')!;
      expect(feedback).not.toBeNull();
      await act(async () => feedback.click());
      expect(ui.container.querySelector('.studio-product-refinement textarea')).not.toBeNull();
      expect(testState.send).not.toHaveBeenCalled();
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-product-image-button')!.click());
      const sheet = document.querySelector<HTMLElement>('.studio-selection-sheet')!;
      expect(sheet.dir).toBe('rtl');
      expect(sheet.querySelector('details, summary')).toBeNull();
      expect(sheet.querySelector('.studio-selection-sheet-description')).not.toBeNull();
      expect(sheet.querySelector('.studio-product-refinement')).toBeNull();
      expect(testState.send).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('keeps utility actions in one disclosure and removes repeated result controls', async () => {
    const ui = await mount();
    try {
      const more = ui.container.querySelector<HTMLDetailsElement>('.studio-result-more')!;
      expect(more.open).toBe(false);
      expect(more.querySelectorAll('.studio-print-trigger')).toHaveLength(1);
      expect(more.querySelectorAll('select')).toHaveLength(1);
      expect(ui.container.querySelector('.studio-result-version-row button')).toBeNull();
      expect(ui.container.querySelector('.studio-current-look')).toBeNull();
      expect(ui.container.querySelector('.studio-mobile-update')).toBeNull();
      expect(ui.container.querySelector('.studio-product-row-actions')?.querySelectorAll('button')).toHaveLength(1);
      expect(testState.send).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('previews an alternative and promotes it only after explicit confirmation in its product sheet', async () => {
    fixturePlan.purchases[0].alternatives = [{ product_id:9, name:'Alternative lamp', price_rial:90000, image_url:'', unique_link:'alternative-lamp' }];
    const ui = await mount();
    try {
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-swap-toggle')!.click());
      expect(ui.container.querySelector('.studio-alternatives .studio-product-refinement')).toBeNull();
      expect(ui.container.querySelector('.studio-alternatives .studio-product-select')).toBeNull();
      await act(async () => ui.container.querySelector<HTMLButtonElement>('button.studio-swap-option')!.click());
      expect(ui.container.querySelector('.is-primary .studio-product-name')?.textContent).toBe('Lamp');
      expect(document.querySelector('.studio-selection-sheet-copy h2')?.textContent).toBe('Alternative lamp');
      expect(testState.send).not.toHaveBeenCalled();
      await act(async () => document.querySelector<HTMLButtonElement>('.studio-selection-sheet > button:last-child')!.click());
      expect(ui.container.querySelector('.is-primary .studio-product-name')?.textContent).toBe('Lamp');
      await act(async () => ui.container.querySelector<HTMLButtonElement>('button.studio-swap-option')!.click());
      const confirm = document.querySelector<HTMLButtonElement>('.studio-selection-sheet-footer button')!;
      expect(confirm.textContent).toBe('studioProductLayout.makePrimary');
      await act(async () => confirm.click());
      expect(ui.container.querySelector('.is-primary .studio-product-name')?.textContent).toBe('Alternative lamp');
      expect(ui.container.querySelector('.studio-swap-name')?.textContent).toBe('Lamp');
      expect(document.querySelector('.studio-selection-sheet')).toBeNull();
      expect(testState.send).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); fixturePlan.purchases[0].alternatives = []; }
  });
  it('places a single combined report last, outside the product, analysis and basket sections', async () => {
    const ui = await mount();
    try {
      const report = ui.container.querySelector('[data-testid=unified-report]')!;
      expect(ui.container.querySelectorAll('[data-testid=unified-report]')).toHaveLength(1);
      expect(report.parentElement?.lastElementChild).toBe(report);
      expect(report.closest('#section-analysis, #section-products, #section-basket, nav')).toBeNull();
    } finally { await ui.cleanup(); }
  });
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
  beforeEach(() => {
    class ReadyImage { naturalWidth = 800; onload?: () => void; onerror?: () => void; decode = async () => {}; set src(_value: string) { queueMicrotask(() => this.onload?.()); } }
    vi.stubGlobal('Image', ReadyImage);
    testState.starting = false; testState.failed = false; testState.processing = false; testState.send.mockClear(); sessionStorage.clear(); localStorage.clear(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() }); vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callback(); return 1; }); });
  it('preserves the generated image behind the original-image comparison', async () => {
    const ui = await mount();
    try {
      expect(ui.container.querySelector('[data-testid=hero]')?.getAttribute('data-result')).toBe('render.jpg');
      expect(ui.container.querySelector('[data-testid=hero]')?.getAttribute('data-original')).toBe('false');
      await act(async () => ui.container.querySelector<HTMLButtonElement>('[data-testid=hero] button')!.click());
      expect(ui.container.querySelector('[data-testid=hero]')?.getAttribute('data-original')).toBe('true');
      expect(ui.container.querySelector('[data-testid=hero]')?.getAttribute('data-result')).toBe('render.jpg');
    } finally { await ui.cleanup(); }
  });
  it('keeps the analysis and products available when image generation failed', async () => {
    testState.failed = true;
    const ui = await mount();
    try {
      expect(ui.container.textContent).toContain('Canonical report');
      expect(ui.container.textContent).toContain('Image failed');
      await act(async () => Array.from(ui.container.querySelectorAll('button')).find(button => button.textContent === 'دیدن پیشنهادهای آماده')!.click());
      expect(ui.container.querySelector('.studio-impact-card')).toBeNull();
      expect(ui.container.querySelector('.studio-tier-section')).not.toBeNull();
      expect(ui.container.querySelector('.studio-invoice')).not.toBeNull();
      expect(ui.container.querySelector('.studio-flow-content')).toBeNull();
      expect(document.querySelector('[role=dialog]')).toBeNull();
    } finally { await ui.cleanup(); testState.failed = false; }
  });
  it('keeps the real job loading until rendering finishes, then preserves result sections', async () => {
    testState.processing = true;
    const ui = await mount();
    try {
      expect(ui.container.querySelector('.homa-loading-page')).not.toBeNull();
      expect(ui.container.querySelector('.studio-invoice')).toBeNull();
      testState.processing = false;
      await ui.render();
      expect(document.querySelector('.homa-result-reveal')).not.toBeNull();
      await act(async () => document.querySelector<HTMLButtonElement>('.homa-result-reveal-skip')!.click());
      expect(ui.container.querySelector('.homa-loading-page')).toBeNull();
      expect(ui.container.querySelector('#section-products')?.hasAttribute('hidden')).toBe(false);
      expect(ui.container.querySelector('#section-analysis')?.hasAttribute('hidden')).toBe(true);
      expect(ui.container.querySelector('#section-basket')?.hasAttribute('hidden')).toBe(true);
      expect(testState.send).not.toHaveBeenCalled();
    } finally { testState.processing = false; await ui.cleanup(); }
  });
  it('opens one drawer, preserves an unsent draft, and closes without sending', async () => {
    testState.send.mockClear();
    const ui = await mount();
    try {
      const trigger = ui.container.querySelector<HTMLButtonElement>('.studio-workspace-nav button:last-child')!;
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
  it('opens a linked recommendation from the separate analysis view', async () => {
    const ui = await mount();
    try {
      const analysis = Array.from(ui.container.querySelectorAll<HTMLButtonElement>('.studio-summary-nav button')).find(button => button.textContent === 'studio.result.v2.phase.analysis')!;
      await act(async () => analysis.click());
      expect(ui.container.querySelector('#section-products')?.hasAttribute('hidden')).toBe(true);
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-diagnosis-action button')!.click());
      expect(ui.container.querySelector('#section-products')?.hasAttribute('hidden')).toBe(false);
      expect(ui.container.querySelector('#section-analysis')?.hasAttribute('hidden')).toBe(true);
    } finally { await ui.cleanup(); }
  });
  it('only an explicit preview sends the selected item/product, without fabricated text', async () => {
    testState.send.mockClear();
    const ui = await mount();
    try {
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-product-image-button')!.click());
      await act(async () => Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'redesignJourney.preview')!.click());
      expect(testState.send).toHaveBeenCalledExactlyOnceWith({ text: '', action: 'preview_product', itemId: 'lamp', productId: 7 });
      expect(document.querySelector('[role=dialog]')).not.toBeNull();
    } finally { await ui.cleanup(); }
  });
});
