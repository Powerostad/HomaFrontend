import type { BackendProduct, ExecutionPlan } from '../../RoomRedesign/services/redesignChatService';

// UI sample only: these are not merchant facts, model output or purchasable SKUs.
const product = (variant: number): BackendProduct => ({ product_id: 1, name: 'فرش کرم با بافت طبیعی', price_rial: 43500000,
  unique_link: 'sample-only', image_url: '/images/comparison/rug/after.webp',
  candidate: { variant_id: variant, variant_label: variant === 10 ? 'اندازهٔ کوچک' : 'اندازهٔ بزرگ', dimensions_cm: { width_cm: variant === 10 ? 150 : 200, length_cm: 300 },
    quantity: 1, eligibility: 'eligible', purchase_status: 'needs_verification', known_total_rial: 43500000,
    verification_reasons: ['stock_unknown'], missing_costs: [] } });
export const studioV2Fixture: ExecutionPlan = {
  search_version: 'studio-search-v2', purchases: [{ item_id: 'rug@left', source_item_id: 'rug', placement_id: 'left',
    quantity: 1, category: 'فرش', reason_fa: 'تعریف محدودهٔ نشیمن با رنگ خنثی.', placement_instruction_fa: 'محدودهٔ نشیمن کنار پنجره', relation: 'similar',
    product: product(10), alternatives: [product(11)], review_candidates: [{ ...product(11), product_id: 2, name: 'فرش جایگزین با جنس نامشخص' }],
    retrieval_report: { status: 'needs_verification', reason_codes: [] } }],
  free_actions: [], surface_actions: [], known_subtotal_rial: 43500000, budget_ceiling_toman: 10000000, budget_status: 'incomplete',
  unknown_cost_item_ids: ['rug@left'], cost_gaps: [{ item_id: 'rug@left', reasons: ['delivery_cost'] }],
  verification_gaps: [{ item_id: 'rug@left', reasons: ['stock_unknown'] }],
  review_tasks: [{ id: 'rug@left', item_id: 'rug', placement_id: 'left', route: 'verify_product', missing_attributes: ['material'] }],
  evaluation: { status: 'needs_information', purchase_ready: false, checked_at: '2026-10-19T00:00:00Z', blocked_actions: [] },
};
