// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { PerformancePanel } from './PerformancePanel';
import { loadStudioPerformance } from '../services/redesignChatService';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', dir: () => 'ltr' } }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('../services/redesignChatService', () => ({ loadStudioPerformance: vi.fn() }));
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, onValueChange }: { children: React.ReactNode; onValueChange: (value: string) => void }) => <div onClick={() => onValueChange('performance')}>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
it('loads only when opened, keeps unknown costs unknown, and waits for processing', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.mocked(loadStudioPerformance).mockResolvedValue({ success: true, data: {
    status: 'ready', runs: [], spans: [], summary: { trace_elapsed_timestamp_ms: 1200, api_calls: 1, estimated_cost_usd: null, tokens: { input_tokens: null, output_tokens: null } },
  } });
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<PerformancePanel sessionId="owned" busy={false} />));
    expect(loadStudioPerformance).not.toHaveBeenCalled();
    await act(async () => container.querySelector('button')!.click());
    expect(loadStudioPerformance).toHaveBeenCalledWith('owned');
    expect(container.textContent).toContain('studioDiagnostics.unknown');
    vi.mocked(loadStudioPerformance).mockClear();
    await act(async () => root.render(<PerformancePanel sessionId="owned" busy />));
    expect(loadStudioPerformance).not.toHaveBeenCalled();
    expect(container.textContent).toContain('studioPerformance.pending');
  } finally { await act(async () => root.unmount()); }
});
