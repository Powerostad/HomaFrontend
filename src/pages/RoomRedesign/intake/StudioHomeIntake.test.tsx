// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import '@/i18n/config';
import { StudioHomeIntake } from './StudioHomeIntake';

vi.mock('@/components/Header', () => ({ Header: () => null }));
vi.mock('@/utils/apiClient', () => ({
  apiGet: vi.fn(async () => ({ success: true, data: { gift: true, can_start: true } })),
}));
vi.mock('./intakePhoto', () => ({
  prepareIntakeImage: vi.fn(async () => ({
    image: { dataUrl: 'data:image/png;base64,AAAA', width: 1200, height: 800 }, tooSmall: false,
  })),
}));

it('shows the guide once, accepts photo-only start and keeps the photo while editing the note', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  const target = document.createElement('div');
  document.body.append(target);
  const root = createRoot(target);
  const start = vi.fn();
  const click = async (label: string) => {
    const button = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.trim() === label);
    expect(button, label).toBeTruthy();
    await act(async () => button!.click());
  };
  try {
    await act(async () => root.render(<MemoryRouter><StudioHomeIntake onStartAnalysis={start} /></MemoryRouter>));
    const input = target.querySelector<HTMLInputElement>('input[type=file]')!;
    const gallery = vi.spyOn(input, 'click');
    await click('انتخاب عکس فضای من');
    expect(document.querySelector('[role=dialog]')).toBeTruthy();
    expect(gallery).not.toHaveBeenCalled();
    await click('انتخاب از گالری');
    expect(gallery).toHaveBeenCalledTimes(1);
    await click('انتخاب عکس فضای من');
    expect(gallery).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[role=dialog]')).toBeNull();
    Object.defineProperty(input, 'files', { value: [new File(['sample'], 'room.png', { type: 'image/png' })] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
    await click('ادامه با این عکس');
    await click('مرور درخواست');
    expect(target.textContent).toContain('پیشنهاد طراحی با هما');
    expect(target.textContent).toContain('این طراحی با اعتبار هدیه انجام می‌شه.');
    await click('ویرایش خواسته');
    const textarea = target.querySelector('textarea')!;
    const note = 'نور گرم‌تر باشه و مبل بمونه.';
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, note);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const purchase = Array.from(target.querySelectorAll('label')).find(el => el.textContent === 'قصد خرید دارم')!.querySelector('input')!;
    await act(async () => purchase.click());
    const budget = target.querySelector<HTMLInputElement>('input[inputmode=numeric]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(budget, '۳۰۰۰۰۰');
      budget.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await click('بازگشت به مرور');
    expect(target.textContent).toContain(note);
    await click('شروع طراحی فضای من');
    expect(start).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledWith(expect.objectContaining({
      userNote: expect.stringContaining(note), imageOutputMode: 'api', image: expect.objectContaining({ dataUrl: 'data:image/png;base64,AAAA' }),
      prefsUpdate: expect.objectContaining({ room_type: 'accommodation_test', budget_ceiling: 300000 }),
    }));
  } finally {
    await act(async () => root.unmount());
    target.remove();
    localStorage.clear();
  }
});
