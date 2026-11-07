// @vitest-environment jsdom
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioDiscovery } from './StudioDiscovery';

vi.mock('@/components/figma/AuthenticatedImage', () => ({ AuthenticatedImage: (props: { src: string; alt: string }) => <img {...props} /> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (value: string) => value }) }));
const plan = { purchases: [], free_actions: [{ reason_fa: 'Observed reason', instruction_fa: 'Actual move instruction' }],
  surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: [] };
async function mount(overrides: Partial<ComponentProps<typeof StudioDiscovery>> = {}) {
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  let props: ComponentProps<typeof StudioDiscovery> = { plan: null, originalImage: 'private-room.jpg', sessionId: 'job-a',
    busy: true, error: null, resultAvailable: false, onRetry: vi.fn(), onComplete: vi.fn(), onNew: vi.fn(), onDiscuss: vi.fn(), ...overrides };
  const render = async (update: Partial<typeof props> = {}) => { props = { ...props, ...update }; await act(async () => root.render(<StudioDiscovery {...props} />)); };
  await render();
  return { container, get props() { return props; }, render, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}
beforeEach(() => {
  vi.useFakeTimers(); (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1)); vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const advance = async (ms: number) => act(async () => { vi.advanceTimersByTime(ms); });
describe('production V5 discovery integration', () => {
  it('opens with the sample and makes moodboard the second moment; no private photo before analysis', async () => {
    const ui = await mount();
    try {
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('comparison');
      expect(ui.container.querySelector('[src="private-room.jpg"]')).toBeNull();
      expect(ui.container.textContent).toContain('پروژهٔ نمونه');
      await advance(8000);
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('moodboard');
      await advance(180000);
      expect(ui.container.querySelector('[src="private-room.jpg"]')).toBeNull();
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      expect(ui.container.textContent).toContain('کمی بیشتر زمان می‌برد');
      expect(ui.container.querySelector('[role="progressbar"]')).toBeNull();
    } finally { await ui.cleanup(); }
  });
  it('reveals actual analysis after moodboard, and separately shows genuine decisions', async () => {
    const ui = await mount();
    try {
      await ui.render({ analysisPreview: { studio_documents: { room: { user_facing_summary: { positive_diagnosis: 'Real saved insight' } } } } });
      expect(ui.container.querySelector('[src="private-room.jpg"]')).toBeNull();
      await advance(8000); await advance(1800);
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('room');
      expect(ui.container.querySelector('[src="private-room.jpg"]')).not.toBeNull();
      expect(ui.container.textContent).toContain('Real saved insight');
      await ui.render({ plan, stageKey: 'search' });
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('decisions');
      await advance(7000);
      expect(ui.container.textContent).toContain('Actual move instruction');
      await ui.render({ stageKey: 'render' });
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('finishing');
      expect(ui.props.onComplete).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('immediately reveals the real ready moment, then opens the result once on request', async () => {
    const ui = await mount();
    try {
      await ui.render({ plan, busy: false, resultAvailable: true });
      expect(ui.container.querySelector('[role="dialog"]')?.textContent).toContain('طرح فضای تو آماده است.');
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      expect(ui.container.querySelector('.homa-loading-body')?.hasAttribute('inert')).toBe(true);
      const button = [...ui.container.querySelectorAll('button')].find(item => item.textContent?.includes('دیدن طرح من'))!;
      await act(async () => { button.click(); button.click(); });
      expect(ui.props.onComplete).toHaveBeenCalledOnce();
      await advance(150000); await ui.render();
      expect(ui.props.onComplete).toHaveBeenCalledOnce();
    } finally { await ui.cleanup(); }
  });
  it('reveals findings individually even with a summary, pairs their fixes, and retains the room during rendering', async () => {
    const ui = await mount({ analysisPreview: { studio_documents: { room: {
      user_facing_summary: { positive_diagnosis: 'Actual room strength' },
      room_analysis: { layout_evaluation: { layout_issues: [
        { issue_id: 'one', evidence: 'First actual finding' }, { issue_id: 'two', evidence: 'Second actual finding' },
      ] } }, layout_fix_plan: [{ resolves_issue_id: 'one', specific_instruction: 'First matching fix' }],
    } } } });
    try {
      await advance(8000); await advance(1800);
      const text = () => ui.container.querySelector('.homa-loading-insight-card')?.textContent;
      expect(text()).toContain('Actual room strength');
      expect(text()).not.toContain('First actual finding');
      await advance(7000);
      expect(text()).toContain('First actual finding'); expect(text()).toContain('First matching fix');
      expect(text()).not.toContain('Second actual finding');
      await ui.render({ stageKey: 'render' });
      expect(ui.container.querySelector('[src="private-room.jpg"]')).not.toBeNull();
      expect(ui.container.querySelector('.homa-loading-personal .homa-loading-caption')).toBeNull();
      const pause = [...ui.container.querySelectorAll('button')].find(button => button.textContent === 'توقف نمایش')!;
      await act(async () => pause.click()); await advance(14000);
      expect(text()).toContain('First actual finding');
      const next = [...ui.container.querySelectorAll('button')].find(button => button.textContent === 'نکتهٔ بعدی')!;
      await act(async () => next.click()); expect(text()).toContain('Second actual finding');
      expect(ui.props.onComplete).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('does not complete on an error; retries are explicit and reset the presentation', async () => {
    const ui = await mount();
    try {
      await ui.render({ busy: false, error: 'Actual failure', plan });
      expect(ui.container.textContent).toContain('Actual failure');
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      expect(ui.props.onRetry).not.toHaveBeenCalled();
      const retry = [...ui.container.querySelectorAll('button')].find(button => button.textContent === 'تلاش دوباره')!;
      await act(async () => retry.click()); expect(ui.props.onRetry).toHaveBeenCalledOnce();
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('comparison');
    } finally { await ui.cleanup(); }
  });
  it('resets insight and photo presentation for a different job, without showing stale user data', async () => {
    const ui = await mount({ plan });
    try {
      await advance(8000); await advance(1800);
      expect(ui.container.textContent).toContain('Actual move instruction');
      await ui.render({ sessionId: 'job-b', plan: null, analysisPreview: null, originalImage: 'other-room.jpg' });
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('comparison');
      expect(ui.container.querySelector('[src="other-room.jpg"]')).toBeNull();
      expect(ui.container.textContent).not.toContain('Actual move instruction');
    } finally { await ui.cleanup(); }
  });
  it('stays truthful when the uploaded photo is unavailable or the server asks a question', async () => {
    const ui = await mount({ originalImage: null, analysisPreview: { studio_documents: {} } });
    try {
      await advance(8000); await advance(1800);
      expect(ui.container.querySelector('main')?.getAttribute('data-moment')).toBe('moodboard');
      await ui.render({ busy: false });
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      expect(ui.container.textContent).toContain('بازکردن گفت‌وگو');
    } finally { await ui.cleanup(); }
  });
  it('supports keyboard comparison without changing job status or invoking an API', async () => {
    const ui = await mount();
    try {
      const slider = ui.container.querySelector('[role="slider"]')!;
      await act(async () => { slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); });
      expect(slider.getAttribute('aria-valuenow')).toBe('88');
      await act(async () => { slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })); });
      expect(slider.getAttribute('aria-valuenow')).toBe('12');
      expect(ui.props.onComplete).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('does not start automatic comparison motion when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const ui = await mount();
    try {
      expect(requestAnimationFrame).not.toHaveBeenCalled();
      const slider = ui.container.querySelector('[role="slider"]')!;
      await act(async () => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
      expect(slider.getAttribute('aria-valuenow')).toBe('54');
    } finally { await ui.cleanup(); }
  });
  it('allows pointer dragging and releases motion pause without changing processing', async () => {
    const ui = await mount();
    try {
      const slider = ui.container.querySelector<HTMLElement>('[role="slider"]')!;
      vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 400 } as DOMRect);
      await act(async () => slider.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300, button: 0, bubbles: true })));
      expect(slider.getAttribute('aria-valuenow')).toBe('50');
      await act(async () => slider.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, bubbles: true })));
      expect(slider.getAttribute('aria-valuenow')).toBe('25');
      await act(async () => slider.dispatchEvent(new MouseEvent('pointerup', { bubbles: true })));
      expect(ui.props.onComplete).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
});


describe('automatic integrated reveal preparation', () => {
  const fakeImages = () => {
    const images: { onload?: () => void; onerror?: () => void; naturalWidth: number; decode: () => Promise<void> }[] = [];
    class TestImage { naturalWidth = 800; src = ''; onload?: () => void; onerror?: () => void; decode = async () => {}; constructor() { images.push(this); } }
    vi.stubGlobal('Image', TestImage); return images;
  };
  it('stays truthful while rendering, then waits for both image decodes before automatic reveal', async () => {
    const images = fakeImages(); const ui = await mount({ plan, autoRevealImage: 'final.jpg', resultAvailable: true });
    try {
      expect(images).toHaveLength(0); await ui.render({ busy: false }); expect(images).toHaveLength(2);
      await act(async () => images[0].onload!()); expect(ui.props.onComplete).not.toHaveBeenCalled();
      await act(async () => images[1].onload!()); expect(ui.props.onComplete).toHaveBeenCalledExactlyOnceWith(true);
      await ui.render(); expect(ui.props.onComplete).toHaveBeenCalledOnce();
    } finally { await ui.cleanup(); }
  });
  it('retries failed images without invoking the model retry handler and supports leaving with recommendations', async () => {
    const images = fakeImages(); const ui = await mount({ plan, busy: false, autoRevealImage: 'bad.jpg', resultAvailable: true });
    try {
      await act(async () => images[0].onerror!());
      expect(ui.container.textContent).toContain('تصویر طرح هنوز بارگذاری نشده');
      await act(async () => [...ui.container.querySelectorAll('button')].find(button => button.textContent === 'تلاش دوباره')!.click());
      expect(ui.props.onRetry).not.toHaveBeenCalled(); expect(images).toHaveLength(4);
      await act(async () => images[2].onerror!());
      await act(async () => [...ui.container.querySelectorAll('button')].find(button => button.textContent === 'دیدن پیشنهادهای آماده')!.click());
      expect(ui.props.onComplete).toHaveBeenCalledExactlyOnceWith(false);
    } finally { await ui.cleanup(); }
  });
  it('vertical swipes do not capture or alter the inspirational comparison', async () => {
    const ui = await mount();
    try {
      const slider = ui.container.querySelector<HTMLElement>('[role=slider]')!;
      const capture = vi.fn(); slider.setPointerCapture = capture;
      await act(async () => { slider.dispatchEvent(new MouseEvent('pointerdown', { clientX: 200, clientY: 100, bubbles: true })); slider.dispatchEvent(new MouseEvent('pointermove', { clientX: 205, clientY: 150, bubbles: true })); });
      expect(capture).not.toHaveBeenCalled(); expect(slider.getAttribute('aria-valuenow')).toBe('50');
    } finally { await ui.cleanup(); }
  });
});
