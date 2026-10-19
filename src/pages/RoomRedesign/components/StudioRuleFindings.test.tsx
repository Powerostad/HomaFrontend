// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { StudioRuleFindings } from './StudioRuleFindings';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (s: string) => s, siteValue: (s: string) => s }) }));

it('distinguishes an action blocker from a design note without offering automatic retries', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const base = { scene_id: 'scene', rule_id: 'rule', kind: 'product', target_id: 'target', action_id: 'action', label_fa: 'پرده' };
  await act(async () => root.render(<StudioRuleFindings findings={[
    { ...base, level: 'blocked', message_fa: 'اندازه لازم است' },
    { ...base, rule_id: 'explanation', level: 'warning', message_fa: 'توضیح تکمیل شود' },
  ]} />));
  expect(host.textContent).toContain('توقف همین اقدام');
  expect(host.textContent).toContain('یادداشت طراحی');
  expect(host.textContent).toContain('پرده');
  expect(host.querySelector('button')).toBeNull();
  await act(async () => root.unmount());
});

it('keeps a missing purchase measurement separate from the visible design', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  await act(async () => root.render(<StudioRuleFindings findings={[
    { scene_id: 'scene', rule_id: 'purchase.prerequisite', kind: 'product', target_id: 'curtain',
      action_id: 'action', label_fa: 'پرده', level: 'warning', message_fa: 'اندازه پیش از سفارش لازم است' },
  ]} />));
  expect(host.textContent).toContain('ایدهٔ طراحی قابل نمایش است');
  expect(host.textContent).toContain('اطلاعات لازم پیش از خرید');
  expect(host.textContent).not.toContain('توقف همین اقدام');
  await act(async () => root.unmount());
});
