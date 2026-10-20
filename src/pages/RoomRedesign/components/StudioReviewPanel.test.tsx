// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import type { ExecutionPlan } from '../services/redesignChatService';
import { StudioReviewPanel } from './StudioReviewPanel';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (s: string) => s }) }));
vi.mock('@/utils/formatters', () => ({ formatPriceFromRial: (value: number) => String(value) }));
vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteText: (s: string) => s, siteValue: (s: string) => s }) }));

it('removes the complete review panel and old review details when reviews are disabled', async () => {
  const host=document.createElement('div');
  const root=createRoot(host);
  const action=vi.fn();
  const plan:ExecutionPlan={purchases:[],free_actions:[],surface_actions:[],known_subtotal_rial:0,
    budget_ceiling_toman:null,budget_status:'unspecified',unknown_cost_item_ids:[],
    image_review:{status:'conflict',checks:[],exact_variant_verified:false},
    evaluation:{model_reviews_enabled:false,status:'accepted',purchase_ready:false,checked_at:'',blocked_actions:[],
      coherence:{status:'replan_required',summary_fa:'OLD_REVIEW',assessments:[]},
      visual_review:{status:'conflict',assessments:[]}}};
  await act(async()=>root.render(<StudioReviewPanel plan={plan} busy={false} onAction={action}/>));
  expect(host.innerHTML).toBe('');
  expect(action).not.toHaveBeenCalled();
  await act(async()=>root.unmount());
});

it('keeps procurement gaps separate from the design and collapses unverified product links', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const action = vi.fn();
  const plan: ExecutionPlan = {
    visualization: { mode: 'concept', purchase_independent: true },
    purchases: [{ item_id: 'curtain', quantity: 1, category: 'curtain', reason_fa: '',
      relation: 'concept', product: null, alternatives: [],
      review_candidates: [{ product_id: 1, name: 'پرده', merchant_url: 'https://example.com/curtain' }] }],
    free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null,
    budget_status: 'incomplete', unknown_cost_item_ids: ['curtain'],
    evaluation: { status: 'replan_required', purchase_ready: false, checked_at: '',
      blocked_actions: [{ action_id: 'a', kind: 'product', target_id: 'curtain' }] },
  };
  await act(async () => root.render(<StudioReviewPanel plan={plan} busy={false} onAction={action} />));
  expect(host.textContent).toContain('ایدهٔ طراحی مستقل است');
  expect(host.textContent).not.toContain('studioV2.status.replan_required');
  const details = host.querySelector('details');
  expect(details?.open).toBe(false);
  expect(details?.querySelector('a')?.href).toBe('https://example.com/curtain');
  expect(host.querySelectorAll('button').length).toBe(2); // candidate verification + scoped search
  expect(action).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});
