// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioIntake } from './StudioIntake';

const flow = vi.hoisted(() => ({ image: null as null | { dataUrl: string }, preparing: false, imageTooSmall: false,
  error: null, note: '', pickImage: vi.fn(), setNote: vi.fn(), buildPayload: vi.fn() }));
vi.mock('./useIntakeFlow', () => ({ useIntakeFlow: () => flow }));
vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (v: string) => v, siteDirection: () => 'rtl', siteLocale: () => 'fa-IR' }) }));

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.clearAllMocks(); flow.image = null; flow.preparing = false; });
const click = async (text: string) => {
  const button = [...container.querySelectorAll('button')].find(item => item.textContent === text);
  expect(button, text).toBeDefined(); await act(async () => button!.click());
};
const render = async (onStart = vi.fn(), url = '/studio', host = false) => {
  await act(async () => root.render(<MemoryRouter initialEntries={[url]}><StudioIntake host={host} onStartAnalysis={onStart} /></MemoryRouter>));
  return onStart;
};
describe('progressive Studio onboarding', () => {
  it('starts with purpose and requires a photo before continuing', async () => {
    const onStart = await render();
    expect(container.querySelector('h1')?.textContent).toBe('برای خانهٔ خودت، یا مهمان‌هایت؟');
    expect(container.querySelector('textarea')).toBeNull();
    await click('ادامه'); await click('ادامه');
    expect(container.querySelector('h1')?.textContent).toBe('همین فضا را به ما نشان بده.');
    expect([...container.querySelectorAll('button')].find(b => b.textContent === 'ادامه با این عکس')?.disabled).toBe(true);
    expect(container.querySelectorAll('input[type=file]')).toHaveLength(2);
    expect(onStart).not.toHaveBeenCalled(); expect(flow.buildPayload).not.toHaveBeenCalled();
  });
  it('uses room-specific images and hands off optional preferences only on final confirmation', async () => {
    flow.image = { dataUrl: 'data:image/jpeg;base64,original' };
    const payload = { image: flow.image, userNote: 'همین متن من', goals: [], createdAt: 'now' };
    flow.buildPayload.mockReturnValue(payload);
    const onStart = await render(vi.fn(), '/studio?audience=home&room=bedroom');
    await click('ادامه با این عکس'); await click('ادامه');
    const styles = container.querySelectorAll('.studio-mood-options [role=img]');
    expect(styles).toHaveLength(4);
    expect(styles[0].getAttribute('aria-label')).toContain('اتاق خواب');
    expect(styles[0].getAttribute('viewBox')).toBe('0.5 0.5 99 99');
    await click('ادامه'); await click('ادامه');
    expect(container.querySelector('h1')?.textContent).toBe('طرح از همین‌جا شروع می‌شود.');
    expect(onStart).not.toHaveBeenCalled(); await click('شروع طراحی فضای من');
    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith({ ...payload, roomType: 'bedroom', prefsUpdate: { room_type: 'bedroom', goals: [], preserved_items: [], budget_ceiling: null } });
    expect(flow.setNote).not.toHaveBeenCalled();
  });
  it('shows host-specific goals and keeps photo and choices when going back', async () => {
    flow.image = { dataUrl: 'data:image/jpeg;base64,original' };
    await render(vi.fn(), '/studio/hosts', true);
    expect(container.textContent).toContain('استودیو برای میزبان‌ها');
    await click('ادامه'); await click('ادامه با این عکس');
    expect(container.textContent).toContain('جذاب‌تر در عکس آگهی');
    expect(container.textContent).not.toContain('تازه‌تر و امروزی‌تر');
    await act(async () => (container.querySelector('.studio-goal-options button') as HTMLButtonElement).click());
    await click('ادامه'); await click('قبلی');
    expect(container.querySelector('.studio-goal-options button')?.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.studio-original-photo')?.getAttribute('src')).toBe(flow.image.dataUrl);
  });
  it('prevents invalid budgets and permits no-purchase instead of an invented amount', async () => {
    flow.image = { dataUrl: 'data:image/jpeg;base64,original' };
    await render(vi.fn(), '/studio?room=kitchen');
    await click('ادامه با این عکس'); await click('ادامه'); await click('ادامه');
    await click('سقف بودجه دارم'); await click('ادامه');
    expect(container.querySelector('[role=alert]')?.textContent).toBe('یک مبلغ معتبر و بیشتر از صفر وارد کن.');
    await click('فعلاً خرید نمی‌کنم'); await click('ادامه');
    expect(container.querySelector('h1')?.textContent).toBe('طرح از همین‌جا شروع می‌شود.');
  });
});
