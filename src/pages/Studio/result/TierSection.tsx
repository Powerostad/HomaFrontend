/**
 * TierSection -- Groups recommendation cards by intervention tier
 *
 * Receives a TierGroup (tier key + CategoryGroup[]) and renders a tier header
 * with label and subtle accent line from TIER_CONFIG. Maps over groups to
 * render RecommendationCard for each. Editorial spacing with generous gaps.
 */
import { useTranslation } from 'react-i18next';
import { toLocalizedDigits } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import { type TierGroup, TIER_CONFIG } from './types';
import { RecommendationCard } from './RecommendationCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TierSectionProps {
  tierGroup: TierGroup;
  // Pass-through state from useStudioResult
  acceptedItems: Set<number>;
  expandedWhyGroups: Set<number>;
  collapsedCards: Set<number>;
  basketProductIds: Set<string>;
  quantityOverrides: Map<number, number>;
  productQuantityOverrides: Map<string, number>;
  // Pass-through handlers from useStudioResult
  onToggleAccept: (itemId: number) => void;
  onToggleWhy: (itemId: number) => void;
  onToggleCollapse: (itemId: number) => void;
  onSelectProduct: (product: Product) => void;
  toggleBasketProduct: (productId: string) => void;
  setQuantity: (itemId: number, newQuantity: number) => void;
  setProductQuantity: (productId: string, newQuantity: number) => void;
  /** Step number offset so cards across tiers show sequential numbering */
  stepStartIndex?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TierSection({
  tierGroup,
  acceptedItems,
  expandedWhyGroups,
  collapsedCards,
  basketProductIds,
  quantityOverrides,
  productQuantityOverrides,
  onToggleAccept,
  onToggleWhy,
  onToggleCollapse,
  onSelectProduct,
  toggleBasketProduct,
  setQuantity,
  setProductQuantity,
  stepStartIndex = 0,
}: TierSectionProps) {
  const { t } = useTranslation();
  const cfg = TIER_CONFIG[tierGroup.tier];

  if (!tierGroup.items || tierGroup.items.length === 0) return null;

  return (
    <section
      className="flex flex-col"
      style={{ marginBottom: 'var(--spacing-xl, 32px)' }}
    >
      {/* Tier header with accent line */}
      <div
        className="flex items-center justify-between"
        style={{
          marginBottom: 'var(--spacing-md, 16px)',
          paddingBottom: 'var(--spacing-xs, 4px)',
          borderBottom: `2px solid ${cfg.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2">
          {/* Accent dot */}
          <span
            className="rounded-full shrink-0"
            style={{
              width: 8,
              height: 8,
              background: cfg.color,
            }}
          />
          <span
            style={{
              fontSize: 'var(--text-label-size, 14px)',
              fontWeight: 700,
              color: 'var(--color-editorial-charcoal)',
              letterSpacing: '0.04em',
            }}
          >
            {cfg.label}
          </span>
        </div>

        <span
          style={{
            fontSize: 'var(--text-caption-size, 12px)',
            color: 'var(--color-editorial-taupe)',
            opacity: 0.6,
          }}
        >
          {toLocalizedDigits(tierGroup.items.length)}{' '}
          {t('studio.result.v2.tierItemCount', 'گزینه')}
        </span>
      </div>

      {/* Card list with generous spacing */}
      <div className="flex flex-col" style={{ gap: 'var(--spacing-2xl, 40px)' }}>
        {tierGroup.items.map((group, idx) => {
          const stepNumber = stepStartIndex + idx + 1;
          const quantity = quantityOverrides.get(group.itemId) ?? group.quantity;

          return (
            <RecommendationCard
              key={group.itemId}
              group={group}
              stepNumber={stepNumber}
              isAccepted={acceptedItems.has(group.itemId)}
              isWhyExpanded={expandedWhyGroups.has(group.itemId)}
              isCollapsed={collapsedCards.has(group.itemId)}
              quantity={quantity}
              basketProductIds={basketProductIds}
              productQuantityOverrides={productQuantityOverrides}
              onToggleAccept={() => onToggleAccept(group.itemId)}
              onToggleWhy={() => onToggleWhy(group.itemId)}
              onToggleCollapsed={() => onToggleCollapse(group.itemId)}
              onProductClick={onSelectProduct}
              onQuantityChange={(newQty) => setQuantity(group.itemId, newQty)}
              toggleBasketProduct={toggleBasketProduct}
              setProductQuantity={setProductQuantity}
            />
          );
        })}
      </div>
    </section>
  );
}
