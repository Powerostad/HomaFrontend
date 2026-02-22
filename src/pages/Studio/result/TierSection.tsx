/**
 * TierSection — Zara Home Editorial Feed
 *
 * Clean vertical feed with generous whitespace.
 * Tier headers are minimal — just a quiet label when needed.
 */
import { toLocalizedDigits } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import { type CategoryGroup, type InterventionTier, TIER_CONFIG } from './types';
import { RecommendationCard } from './RecommendationCard';

const FONT = 'var(--font-family-vazirmatn)';

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
}: TierSectionProps) {
  const cfg = TIER_CONFIG[tier];

  if (!items || items.length === 0) return null;

  return (
    <div
      style={{
        fontFamily: FONT,
        marginBottom: 'var(--spacing-xl)',
      }}
    >
      {/* Tier label — quiet, editorial */}
      {tier !== 'quick_win' && (
        <div
          className="flex items-center justify-between"
          style={{
            marginBottom: 'var(--spacing-md)',
            paddingBottom: 'var(--spacing-xs)',
            borderBottom: '1px solid var(--editorial-hairline)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-label-size)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: FONT,
              color: 'var(--editorial-charcoal)',
              letterSpacing: '0.04em',
            }}
          >
            {cfg.label}
          </span>
          <span
            style={{
              fontSize: 'var(--text-caption-size)',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              opacity: 0.5,
            }}
          >
            {toLocalizedDigits(items.length)} گزینه
          </span>
        </div>
      )}

      {/* Vertical product feed */}
      <div className="flex flex-col" style={{ gap: 'var(--spacing-2xl)' }}>
        {items.map((group, idx) => {
          const priorityRank = priorityRankedIds.indexOf(group.itemId) + 1;
          const isTopPriority = priorityRankedIds[0] === group.itemId;
          const isLast = idx === items.length - 1;
          const stepNumber = stepStartIndex + idx + 1;

          return (
            <RecommendationCard
              key={group.itemId}
              group={group}
              tier={tier}
              isTopPriority={isTopPriority}
              priorityRank={priorityRank}
              stepNumber={stepNumber}
              isWhyExpanded={expandedWhyGroups.has(group.itemId)}
              isSaved={isSaved}
              isAccepted={acceptedItems.has(group.itemId)}
              sessionId={sessionId}
              basketProductIds={basketProductIds}
              onToggleWhy={() => onToggleWhy(group.itemId)}
              onProductClick={onProductClick}
              onToggleSaved={onToggleSaved}
              onToggleAccepted={() => onToggleAccepted(group.itemId)}
              onToggleBasketProduct={onToggleBasketProduct}
              onScrollToAnalysis={onScrollToAnalysis}
              onUpdateQuantity={onUpdateQuantity ? (qty) => onUpdateQuantity(group.itemId, qty) : undefined}
              isLast={isLast}
            />
          );
        })}
      </div>
    </div>
  );
}