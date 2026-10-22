// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import StudioComparePage from './StudioComparePage';
import { fromSession, newCase, type ComparisonCase } from './comparison';
import { loadWorkspace, saveWorkspace } from './storage';
import { loadChatSession } from '../RoomRedesign/services/redesignChatService';

vi.mock('@/components/Header', () => ({ Header: () => <header>HOMA</header> }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner-1' } }) }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (s: string) => s, siteLocale: () => 'fa-IR', siteDirection: () => 'rtl' }) }));
vi.mock('./storage', () => ({ loadWorkspace: vi.fn(), saveWorkspace: vi.fn(async () => {}) }));
vi.mock('../RoomRedesign/services/redesignChatService', () => ({ loadChatSession: vi.fn(), loadSessionDiagnostics: vi.fn(), loadStudioPerformance: vi.fn() }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

function fixture(): ComparisonCase {
  const item = newCase(0.9);
  item.title = 'اتاق خواب';
  const arm = fromSession({ session_id: 'saved', status: 'active', title: '', turns: [] });
  item.arms = { A: { ...arm, source: 'SECRET_SERVER', design: 'طرح اول' }, B: { ...arm, source: 'SECRET_LOCAL', design: 'طرح دوم' } };
  return item;
}
it('renders blind comparison, records the actual arm, and makes no model/transport calls', async () => {
  vi.useFakeTimers();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(loadWorkspace).mockResolvedValue([fixture()]);
  const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter><StudioComparePage /></MemoryRouter>));
    expect(container.textContent).not.toContain('SECRET_SERVER');
    expect(container.textContent).not.toContain('SECRET_LOCAL');
    expect(loadChatSession).not.toHaveBeenCalled();
    const form = container.querySelector('form')!;
    const radio = form.querySelector<HTMLInputElement>('input[value="B"]')!;
    await act(async () => radio.click());
    await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await act(async () => vi.advanceTimersByTime(600));
    const calls = vi.mocked(saveWorkspace).mock.calls;
    const saved = calls[calls.length - 1];
    expect(saved[0]).toBe('owner-1');
    expect(saved[1][0].votes.design).toMatchObject({ choice: 'B', blind: true });
    const reveal = [...container.querySelectorAll('button')].find(button => button.textContent === 'نمایش منابع، هزینه و زمان')!;
    await act(async () => reveal.click());
    expect(container.textContent).toContain('SECRET_SERVER');
    expect(container.textContent).toContain('SECRET_LOCAL');
    expect(container.textContent).toContain('هزینه ناقص یا نامشخص است');
    expect(loadChatSession).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); container.remove(); }
});

it('does not allow choosing a winner before both outputs are present', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(loadWorkspace).mockResolvedValue([newCase()]);
  const container = document.createElement('div'); const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter><StudioComparePage /></MemoryRouter>));
    expect(container.querySelector<HTMLInputElement>('input[value="A"]')!.disabled).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[value="unassessed"]')!.disabled).toBe(false);
  } finally { await act(async () => root.unmount()); }
});
