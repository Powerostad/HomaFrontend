// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { TokenCostEstimate } from './TokenCostEstimate';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }) }));

it('keeps unavailable usage unknown and separates partial estimates from receipts', async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    await act(async () => root.render(<TokenCostEstimate estimate={{ status: 'unavailable', lower_usd: null,
      upper_usd: null, estimated_calls: 0, unknown_calls: 1,
      stages: [{ stage: 'studio_analysis_v3', calls: 1, estimated_calls: 0, unknown_calls: 1, low: '0', high: '0' }] }} />));
    expect(container.textContent).toContain('studioDiagnostics.estimate_unavailable');
    expect(container.textContent).toContain('studioDiagnostics.unknown');
    expect(container.textContent).not.toContain('0 USD');
    await act(async () => root.render(<TokenCostEstimate estimate={{ status: 'partial', lower_usd: '0.045',
      upper_usd: '0.09', estimated_calls: 2, unknown_calls: 1,
      stages: [{ stage: 'studio_design_opening_v3', calls: 3, estimated_calls: 2, unknown_calls: 1, low: '0.045', high: '0.09' }] }} />));
    expect(container.textContent).toContain('studioDiagnostics.estimate_partial');
    expect(container.textContent).toContain('0.045 – 0.09 USD');
    expect(container.textContent).toContain('studioDiagnostics.estimateHint');
  } finally { await act(async () => root.unmount()); }
});
