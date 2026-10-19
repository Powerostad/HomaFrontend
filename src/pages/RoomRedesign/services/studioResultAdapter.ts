import type { Product } from '../../Studio/components/ProductDetailSheet';
import type { CategoryGroup } from '../../Studio/result/types';
import type { ExecutionPlan } from './redesignChatService';

/** Adapt data only: the original Studio owns every result component and layout. */
export function toStudioCategoryGroups(plan: ExecutionPlan | null): CategoryGroup[] {
  if (!plan) return [];
  const purchases: CategoryGroup[] = plan.purchases.map((item, index) => {
    const mother = item.mother_product;
    const impact = mother?.scores?.impact_score;
    const seen = new Set<string>();
    const products: Product[] = [item.product, ...item.alternatives].flatMap(product => {
      if (!product) return [];
      const key = `${product.product_id}/${product.candidate?.variant_id ?? 'parent'}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const price = product.price_rial ?? (product.price_toman != null ? product.price_toman * 10 : null);
      return [{
        id: plan.search_version ? `${item.item_id}/${key}` : `${item.item_id}/${product.product_id}`, name: product.name,
        studioItemId: item.source_item_id || item.item_id, studioPlacementId: item.placement_id,
        studioProductId: product.product_id, variantId: product.candidate?.variant_id,
        variantLabel: product.candidate?.variant_label, dimensionsCm: product.candidate?.dimensions_cm,
        orderQuote: product.candidate?.order_quote,
        purchaseStatus: plan.search_version && !item.product ? 'needs_verification' : product.candidate?.purchase_status,
        image: product.image_url || '', price: price ?? 0, priceUnknown: price == null || price <= 0,
        category: product.category_fa || item.category, store: product.merchant_name,
        description: product.description || product.ai_description,
        // match_notes are search diagnostics, not customer-facing design guidance.
        persianReason: item.reason_fa || mother?.why_needed,
        uniqueLink: product.unique_link,
        link: product.merchant_url && /^https?:\/\//i.test(product.merchant_url) ? product.merchant_url : undefined,
      }];
    });
    const placement = (plan.search_version ? item.placement_instruction_fa : mother?.placement_instruction) || item.placement_instruction_fa || '';
    return {
      itemId: index + 1, category: item.category, categoryDisplay: mother?.product_name_generic || item.category,
      recommendationReasonFa: item.reason_fa || mother?.why_needed || '',
      designRationaleFa: placement || mother?.why_needed || '', recommendedSize: '',
      quantity: plan.search_version ? item.quantity : Math.max(1, Math.min(99, item.quantity || 1)), placements: placement ? [placement] : [],
      positionInImage: null, products, actionStatus: products.length ? 'available' : 'custom_order',
      interventionTier: 'quick_win', impactKnown: Number.isFinite(impact),
      impactLevel: impact != null && impact >= 7 ? 'high' : impact != null && impact >= 4 ? 'medium' : 'low',
      actionGuidance: mother?.why_needed || item.reason_fa,
    };
  });
  const actions: CategoryGroup[] = [...plan.free_actions.map(action => ({ reason: action.reason_fa, instruction: action.instruction_fa, kind: 'layout' as const })),
    ...plan.surface_actions.map(action => ({ reason: '', instruction: action.change_fa, kind: 'service' as const }))].map((action, index) => ({
    itemId: purchases.length + index + 1, category: 'action', categoryDisplay: action.instruction,
    recommendationReasonFa: action.reason, designRationaleFa: action.instruction,
    recommendedSize: '', quantity: 1, placements: [], positionInImage: null, products: [],
    actionStatus: 'architectural', interventionTier: action.kind === 'service' ? 'structural' : 'enhancement', impactLevel: 'low', impactKnown: false,
    actionKind: action.kind,
    actionGuidance: action.instruction,
  }));
  return [...purchases, ...actions];
}
