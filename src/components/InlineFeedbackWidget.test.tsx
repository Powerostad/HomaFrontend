// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { InlineFeedbackWidget } from './InlineFeedbackWidget';
import { apiPost } from '@/utils/apiClient';
vi.mock('@/utils/apiClient', () => ({ apiPost: vi.fn() }));
vi.mock('@/analytics/events', () => ({ trackFeedbackSubmitted: vi.fn() }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (v: unknown) => v }) }));
vi.mock('react-i18next', async original => ({ ...await original<typeof import('react-i18next')>(), useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

describe('V9 feedback preserves the real API workflow', () => {
  it.each([true, false])('submits the real vote and only stores confirmed feedback: %s', async success => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    vi.mocked(apiPost).mockResolvedValue({ success });
    const node = document.createElement('div'); const root = createRoot(node);
    try {
      await act(async () => root.render(<InlineFeedbackWidget flow="studio" sessionId="v9-feedback-fixture" />));
      await act(async () => node.querySelector<HTMLButtonElement>('button')!.click());
      expect(apiPost).toHaveBeenCalledWith('/recommendations/sessions/v9-feedback-fixture/feedback/', { vote: 1 });
      expect(localStorage.getItem('homa_feedback_studio_v9-feedback-fixture')).toBe(success ? '1' : null);
      if (!success) expect(node.querySelector<HTMLButtonElement>('button')!.disabled).toBe(false);
    } finally { await act(async () => root.unmount()); localStorage.clear(); }
  });
});
