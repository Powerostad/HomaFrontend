import type { Product } from '../../Studio/components/ProductDetailSheet';
import type { CategoryGroup } from '../../Studio/result/types';
import type { ExecutionPlan } from './redesignChatService';

/** Adapt data only: the original Studio owns every result component and layout. */
export function toStudioCategoryGroups(plan: ExecutionPlan | null): CategoryGroup[] {
  if (!plan) return [];
  const purchases: CategoryGroup[] = plan.purchases.map((item, index) => {
    const mother = item.mother_product;
    const impact = mother?.scores?.impact_score;
    const seen = new Set<number>();
    const products: Product[] = [item.product, ...item.alternatives].flatMap(product => {
      if (!product || seen.has(product.product_id)) return [];
      seen.add(product.product_id);
      const price = product.price_rial ?? (product.price_toman != null ? product.price_toman * 10 : null);
      return [{
        id: `${item.item_id}/${product.product_id}`, name: product.name,
        image: product.image_url || '', price: price ?? 0, priceUnknown: price == null || price <= 0,
        category: product.category_fa || item.category, store: product.merchant_name,
        description: product.description || product.ai_description,
        persianReason: item.reason_fa || mother?.why_needed, matchHighlights: product.match_notes,
        uniqueLink: product.unique_link,
        link: product.merchant_url && /^https?:\/\//i.test(product.merchant_url) ? product.merchant_url : undefined,
      }];
    });
    const placement = mother?.placement_instruction || item.placement_instruction_fa || '';
    return {
      itemId: index + 1, category: item.category, categoryDisplay: mother?.product_name_generic || item.category,
      recommendationReasonFa: item.reason_fa || mother?.why_needed || '',
      designRationaleFa: placement || mother?.why_needed || '', recommendedSize: '',
      quantity: Math.max(1, Math.min(99, item.quantity || 1)), placements: placement ? [placement] : [],
      positionInImage: null, products, actionStatus: products.length ? 'available' : 'custom_order',
      interventionTier: 'quick_win', impactKnown: Number.isFinite(impact),
      impactLevel: impact != null && impact >= 70 ? 'high' : impact != null && impact >= 40 ? 'medium' : 'low',
      actionGuidance: mother?.why_needed || item.reason_fa,
    };
  });
  const actions: CategoryGroup[] = [...plan.free_actions.map(action => ({ reason: action.reason_fa, instruction: action.instruction_fa })),
    ...plan.surface_actions.map(action => ({ reason: '', instruction: action.change_fa }))].map((action, index) => ({
    itemId: purchases.length + index + 1, category: 'action', categoryDisplay: action.instruction,
    recommendationReasonFa: action.reason, designRationaleFa: action.instruction,
    recommendedSize: '', quantity: 1, placements: [], positionInImage: null, products: [],
    actionStatus: 'architectural', interventionTier: 'enhancement', impactLevel: 'low', impactKnown: false,
    actionGuidance: action.instruction,
  }));
  return [...purchases, ...actions];
}
