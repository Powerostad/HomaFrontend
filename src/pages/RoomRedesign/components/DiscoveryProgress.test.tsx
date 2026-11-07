// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { DiscoveryElapsed, DiscoveryProgress } from './DiscoveryProgress';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (value: string) => value, siteLocale: () => 'en-GB' }) }));
describe('honest discovery progress', () => {
  it('measures waiting time, freezes it on completion, and never advances the stage just because time passed', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T00:00:00Z'));
    const startedAt = Date.now(), container = document.createElement('div'), root = createRoot(container);
    const render = async (running: boolean) => act(async () => root.render(<><DiscoveryProgress hasAnalysis={false} hasPlan={false} done={false} failed={false} running={running} /><DiscoveryElapsed startedAt={startedAt} running={running} /></>));
    try {
      await render(true); await act(async () => vi.advanceTimersByTime(90000));
      expect(container.querySelector('bdi')?.textContent).toBe('01:30');
      expect(container.querySelector('li[aria-current=step]')?.textContent).toBe('شناخت فضا');
      expect(container.querySelectorAll('li[data-complete=true]')).toHaveLength(0);
      await render(false); await act(async () => vi.advanceTimersByTime(30000));
      expect(container.querySelector('bdi')?.textContent).toBe('01:30');
      expect(container.querySelector('[role=progressbar]')).toBeNull();
    } finally { await act(async () => root.unmount()); vi.useRealTimers(); }
  });
});
