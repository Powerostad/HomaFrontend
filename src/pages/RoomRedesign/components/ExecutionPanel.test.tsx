import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ExecutionPlan } from '../services/redesignChatService';
import type { MotherProduct, StudioMotherDocument } from '../services/motherDocument';
import { ExecutionPanel } from './ExecutionPanel';

vi.mock('@/i18n/siteCopy', () => ({ useSiteTranslation: () => ({ siteValue: (value: unknown) => value }) }));
vi.mock('react-i18next', async importOriginal => ({ ...await importOriginal<typeof import('react-i18next')>(), useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'fa' } }) }));

const motherProduct: MotherProduct = {
  item_id: 'lamp', product_name_generic: 'چراغ ایستاده با نور گرم', category: 'lighting', subcategory: 'floor_lamp',
  recommendation_type: 'add', product_role: 'lighting_layer', visual_problem_solved: ['poor_lighting_layer'],
  related_issue_ids: ['issue1'], why_needed: 'نور چندلایه', placement_instruction: 'کنار مبل و خارج مسیر عبور', render_visibility_requirement: 'must_be_visible',
  search_brief: { fa_keywords: ['چراغ'], en_keywords: ['warm lamp'], preferred_colors: [], preferred_materials: [], preferred_shapes: [], style_tags: [], avoid_attributes: [] },
  shopping_attributes: { effort_level: 'easy', price_sensitivity: 'unknown', replace_existing: false, replaces_existing_item_id: null, installation_needed: false, must_be_visible_in_render: true },
  scores: { impact_score: 8, purchase_priority: 'high', render_visibility: 'high', placement_confidence: 'high', recommendation_confidence: 'high' },
};
const document: StudioMotherDocument = {
  room_type_detection: {}, improvement_mode: {}, change_intensity: {}, visible_scope_analysis: {},
  identity_driven_design: {}, room_analysis: {}, improvement_strategy: {}, existing_items_decision: [], layout_fix_plan: [],
  product_recommendations: [motherProduct], renderer_ready_instructions: {},
  user_facing_summary: { positive_diagnosis: 'نشیمن روشن', main_improvement_idea: 'لایه نور گرم', top_changes: ['نور کنار مبل'], why_these_changes_work: 'هماهنگی نور و بافت', expected_visual_result: 'انتظار فضای گرم‌تر', shopping_message: 'قیمت نامشخص است' },
  render_execution_check: { must_have_products_visible: true }, quality_checks: { evidence_based: true },
};
const plan: ExecutionPlan = {
  purchases: [{ item_id: 'scene:lamp', quantity: 1, reason_fa: 'نور چندلایه', category: 'lighting', relation: 'concept', product: null, alternatives: [], mother_product: motherProduct }],
  free_actions: [], surface_actions: [], known_subtotal_rial: 0, budget_ceiling_toman: null, budget_status: 'incomplete', unknown_cost_item_ids: ['scene:lamp'], studio_documents: { scene: document },
};
const render = (value: ExecutionPlan) => renderToStaticMarkup(<ExecutionPanel plan={value} busy={false} onPreview={() => undefined} />);

describe('canonical mother execution', () => {
  it('shows canonical product name, placement and every summary section, keeping concepts unpriced', () => {
    const html = render(plan);
    expect(html).toContain(motherProduct.product_name_generic);
    expect(html).toContain(motherProduct.placement_instruction);
    for (const value of Object.values(document.user_facing_summary).flat()) expect(html).toContain(value);
    expect(html).toContain('redesignJourney.concept');
    expect(html).toContain('redesignJourney.budget_incomplete');
    expect(html).not.toContain('must_have_products_visible');
  });
  it('keeps legacy versions readable', () => {
    const legacy = { ...plan, studio_documents: undefined, purchases: [{ ...plan.purchases[0], mother_product: undefined }] };
    expect(render(legacy)).toContain('lighting');
    expect(render(legacy)).not.toContain(document.user_facing_summary.main_improvement_idea);
  });
  it('renders user/model text as escaped text, not HTML', () => {
    const unsafe = { ...plan, purchases: [{ ...plan.purchases[0], mother_product: { ...motherProduct, product_name_generic: '<script>alert(1)</script>' } }] };
    expect(render(unsafe)).toContain('&lt;script&gt;');
    expect(render(unsafe)).not.toContain('<script>');
  });
});
