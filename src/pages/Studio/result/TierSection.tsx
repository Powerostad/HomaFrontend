import { useSiteTranslation } from '@/i18n/siteCopy';
import { useTranslation } from 'react-i18next';
import type { Product } from '../components/ProductDetailSheet';
import { RecommendationCard } from './RecommendationCard';
import type { RefineProduct } from './ProductRefinement';
import { type CategoryGroup, type InterventionTier, TIER_CONFIG } from './types';

interface TierSectionProps {
  tier: InterventionTier;
  items: CategoryGroup[];
  allCategoryGroups: CategoryGroup[];
  stepStartIndex?: number;
  priorityRankedIds: number[];
  expandedWhyGroups: Set<number>;
  acceptedItems: Set<number>;
  basketProductIds: Set<string>;
  isSaved: boolean;
  sessionId?: string;
  onToggleWhy: (itemId: number) => void;
  onProductClick: (product: Product) => void;
  onToggleSaved: () => void;
  onToggleAccepted: (itemId: number) => void;
  onToggleBasketProduct: (productId: string) => void;
  onScrollToAnalysis?: () => void;
  onUpdateQuantity?: (itemId: number, newQuantity: number) => void;
  onRefineProduct?: RefineProduct;
  busy?: boolean;
  hideHeading?: boolean;
  onMakePrimary?: (itemId: number, productId: string) => void;
}

export function TierSection({
  tier,
  items,
  stepStartIndex = 0,
  priorityRankedIds,
  expandedWhyGroups,
  acceptedItems,
  basketProductIds,
  isSaved,
  sessionId,
  onToggleWhy,
  onProductClick,
  onToggleSaved,
  onToggleAccepted,
  onToggleBasketProduct,
  onScrollToAnalysis,
  onUpdateQuantity,
  onRefineProduct,
  busy,
  hideHeading = false,
  onMakePrimary,
}: TierSectionProps) {
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const config = TIER_CONFIG[tier];
  const tierTitle = t(`studio.v9.tier.${tier}`, {
    quick_win: 'تغییرهای سریع', enhancement: 'ارتقای فضا', structural: 'تغییرهای اساسی',
  }[tier]);
  if (items.length === 0) return null;

  return (
    <section className="studio-tier-section" aria-label={tierTitle}>
      {!hideHeading && <div className="studio-tier-heading">
        <div>
          <p className="studio-result-eyebrow">{t(`studio.result.v2.tier.${tier === 'quick_win' ? 'quickWin' : tier}`, config.label)}</p>
          <h3>{tierTitle}</h3>
        </div>
        <span>{siteValue(items.length)} {t('studio.result.v2.card.options', 'گزینه')}</span>
      </div>}
      <div className="studio-v9-product-grid">
        {siteValue(items.map((group, index) => (
          <RecommendationCard
            key={group.itemId}
            group={group}
            onMakePrimary={onMakePrimary ? productId => onMakePrimary(group.itemId, productId) : undefined}
            tier={tier}
            isTopPriority={priorityRankedIds[0] === group.itemId}
            priorityRank={priorityRankedIds.indexOf(group.itemId) + 1}
            stepNumber={stepStartIndex + index + 1}
            isWhyExpanded={expandedWhyGroups.has(group.itemId)}
            isSaved={isSaved}
            isAccepted={acceptedItems.has(group.itemId)}
            sessionId={sessionId}
            basketProductIds={basketProductIds}
            onToggleWhy={() => onToggleWhy(group.itemId)}
            onProductClick={onProductClick}
            onRefineProduct={onRefineProduct}
            busy={busy}
            onToggleSaved={onToggleSaved}
            onToggleAccepted={() => onToggleAccepted(group.itemId)}
            onToggleBasketProduct={onToggleBasketProduct}
            onScrollToAnalysis={onScrollToAnalysis}
            onUpdateQuantity={onUpdateQuantity ? (quantity) => onUpdateQuantity(group.itemId, quantity) : undefined}
          />
        )))}
      </div>
    </section>
  );
}
