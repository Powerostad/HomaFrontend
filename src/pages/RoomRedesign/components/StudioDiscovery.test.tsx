// @vitest-environment jsdom
import { act, type ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioDiscovery } from './StudioDiscovery';
import type { ExecutionPlan } from '../services/redesignChatService';

vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/components/figma/AuthenticatedImage', () => ({ AuthenticatedImage: (props: { src: string; alt: string }) => <img {...props} /> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (value: string) => value, siteValue: (value: unknown) => value, siteDirection: () => 'rtl', siteLocale: () => 'fa-IR' }) }));
const source: ExecutionPlan = { purchases: [], free_actions: [
  { reason_fa: 'نور طبیعی فضا مناسب است.', instruction_fa: 'صندلی را نزدیک پنجره بگذار.' },
  { reason_fa: 'مسیر رفت‌وآمد باریک است.', instruction_fa: 'میز را از مسیر ورودی کنار ببر.' },
], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: [] };

async function mount(overrides: Partial<ComponentProps<typeof StudioDiscovery>> = {}) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  let props: ComponentProps<typeof StudioDiscovery> = { plan: source, originalImage: 'room.jpg', sessionId: 'room', busy: true, error: null, resultAvailable: true,
    onRetry: vi.fn(), onComplete: vi.fn(), onNew: vi.fn(), onDiscuss: vi.fn(), ...overrides };
  const render = async (update: Partial<typeof props> = {}) => { props = { ...props, ...update }; await act(async () => root.render(<StudioDiscovery {...props} />)); };
  await render();
  const click = async (label: string) => act(async () => { Array.from(container.querySelectorAll('button')).find(button => button.textContent === label)!.click(); });
  return { container, props, render, click, cleanup: async () => { await act(async () => root.unmount()); container.remove(); } };
}
beforeEach(() => { vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callback(); return 1; }); });
describe('one-finding discovery', () => {
  it('shows accepted analysis while design and product search have not completed', async () => {
    const ui = await mount({ plan: null, resultAvailable: false });
    try {
      const reading = ui.container.querySelector<HTMLElement>('.studio-discovery-reading')!;
      reading.scrollTop = 200;
      await ui.render({ analysisPreview: { studio_documents: { img0: {
        room_analysis: { layout_evaluation: { layout_issues: [{ issue_id: 'issue1', evidence: 'مسیر کنار مبل باریک است.' }] } },
        user_facing_summary: { positive_diagnosis: 'نور طبیعی خوب است.' },
      } } }, stage: 'در حال طراحی تغییرات' });
      expect(ui.container.querySelector('.studio-initial-loading')).toBeNull();
      expect(ui.container.textContent).toContain('مسیر کنار مبل باریک است.');
      expect(reading.scrollTop).toBe(0);
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      await ui.render({ plan: source, busy: true });
      expect(ui.container.textContent).toContain('مسیر کنار مبل باریک است.');
    } finally { await ui.cleanup(); }
  });
  it('replaces initial analysis loading with the terminal error and an explicit retry', async () => {
    const ui = await mount({ plan: null, resultAvailable: false });
    try {
      expect(ui.container.querySelector('.studio-initial-loading')).not.toBeNull();
      await ui.render({ busy: false, error: 'پاسخ مدل با قواعد طراحی سازگار نبود.' });
      expect(ui.container.querySelector('.studio-initial-loading')).toBeNull();
      expect(ui.container.textContent).toContain('پاسخ مدل با قواعد طراحی سازگار نبود.');
      expect(ui.props.onRetry).not.toHaveBeenCalled();
      await ui.click('تلاش دوباره');
      expect(ui.props.onRetry).toHaveBeenCalledOnce();
    } finally { await ui.cleanup(); }
  });
  it('shows no invented findings before the saved analysis arrives', async () => {
    const ui = await mount({ plan: null });
    try {
      expect(ui.container.querySelector('.studio-discovery-finding')).toBeNull();
      expect(ui.container.querySelector('.studio-initial-loading[aria-busy=true]')).not.toBeNull();
      expect(ui.container.querySelector('.studio-discovery-main[data-view=initial]')).not.toBeNull();
      expect(ui.container.querySelector('.studio-discovery-photo img')?.getAttribute('src')).toBe('room.jpg');
      expect(ui.container.querySelector('.studio-discovery-tip')).toBeNull();
      expect(ui.container.querySelectorAll('.studio-discovery-steps li')).toHaveLength(3);
      expect(ui.container.querySelector('[role=progressbar]')).toBeNull();
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      await ui.render({ stage: 'مرحلهٔ واقعی سرویس', plan: null });
      expect(ui.container.querySelector('[role=status]')?.textContent).toBe('مرحلهٔ واقعی سرویس');
      await ui.render({ plan: source });
      expect(ui.container.querySelector('.studio-initial-loading')).toBeNull();
      expect(ui.container.querySelector('.studio-discovery-finding')).not.toBeNull();
    }
    finally { await ui.cleanup(); }
  });
  it('only shows the current finding and allows back navigation without sending anything', async () => {
    const ui = await mount();
    try {
      expect(ui.container.textContent).toContain(source.free_actions[0].instruction_fa);
      expect(ui.container.textContent).not.toContain(source.free_actions[1].instruction_fa);
      await ui.click('نکتهٔ بعدی');
      expect(ui.container.textContent).toContain(source.free_actions[1].instruction_fa);
      expect(ui.container.textContent).not.toContain(source.free_actions[0].instruction_fa);
      await ui.click('قبلی');
      expect(ui.container.textContent).toContain(source.free_actions[0].instruction_fa);
      expect(ui.props.onComplete).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('does not interrupt reading when the result arrives', async () => {
    const ui = await mount();
    try { await ui.render({ busy: false }); expect(ui.props.onComplete).not.toHaveBeenCalled(); await ui.click('دیدن تصویر و پیشنهادها'); expect(ui.props.onComplete).toHaveBeenCalledOnce(); }
    finally { await ui.cleanup(); }
  });
  it('opens the result when ready only after the user explicitly chose to skip/wait', async () => {
    const ui = await mount();
    try { await ui.click('مستقیم به نتیجه'); expect(ui.props.onComplete).not.toHaveBeenCalled(); await ui.render({ busy: false }); expect(ui.props.onComplete).toHaveBeenCalledOnce(); }
    finally { await ui.cleanup(); }
  });
  it('keeps a failed image recoverable and allows opening the saved suggestions', async () => {
    const ui = await mount({ busy: false, error: 'تصویر آماده نشد.' });
    try { await ui.click('تلاش دوباره'); expect(ui.props.onRetry).toHaveBeenCalledOnce(); await ui.click('دیدن پیشنهادهای آماده'); expect(ui.props.onComplete).toHaveBeenCalledOnce(); }
    finally { await ui.cleanup(); }
  });
  it('retains the waiting error instead of automatically hiding it behind the result', async () => {
    const ui = await mount();
    try {
      await ui.click('مستقیم به نتیجه');
      await ui.render({ busy: false, error: 'خطای خروجی', resultAvailable: false });
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      expect(ui.container.querySelector('[role=alert]')?.textContent).toContain('خطای خروجی');
      expect(ui.props.onRetry).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('opens the conversation when a turn finished without an analysis rather than showing an endless loader', async () => {
    const ui = await mount({ plan: null, busy: false, resultAvailable: false });
    try {
      expect(ui.container.querySelector('.studio-initial-loading')).toBeNull();
      expect(ui.container.textContent).toContain('پاسخ هما را ببین');
      await ui.click('بازکردن گفت‌وگو');
      expect(ui.props.onDiscuss).toHaveBeenCalledOnce();
      expect(ui.props.onRetry).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
  it('does not wait for an output when analysis is saved but the service is idle without a plan', async () => {
    const ui = await mount({ plan: null, busy: false, analysisPreview: { studio_documents: { room: { room_analysis: {} } } }, resultAvailable: false });
    try {
      expect(ui.container.querySelector('[role=status]')?.textContent).toBe('تحلیل اولیه آماده است');
      await ui.click('گفت‌وگو برای ادامه');
      expect(ui.props.onDiscuss).toHaveBeenCalledOnce();
      expect(ui.container.querySelector('.studio-discovery-loading')).toBeNull();
    } finally { await ui.cleanup(); }
  });
  it('keeps navigation outside the reading area and does not send a request when discussing a finding', async () => {
    const ui = await mount();
    try {
      expect(ui.container.querySelector('.studio-discovery-reading .studio-discovery-footer')).toBeNull();
      expect(ui.container.querySelector('.studio-discovery-content > .studio-discovery-footer')).not.toBeNull();
      await act(async () => ui.container.querySelector<HTMLButtonElement>('.studio-discovery-discuss')!.click());
      expect(ui.props.onDiscuss).toHaveBeenCalledOnce();
      expect(ui.props.onComplete).not.toHaveBeenCalled();
      expect(ui.props.onRetry).not.toHaveBeenCalled();
    } finally { await ui.cleanup(); }
  });
});
