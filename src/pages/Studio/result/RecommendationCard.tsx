/**
 * RecommendationCard -- Editorial product/action recommendation card
 *
 * Simplified from the vibecoded 1375-line version. Two display modes:
 *   - 'available': Product display with hero, alternatives, basket, quantity
 *   - 'custom_order' / 'architectural': Action guidance with metadata
 *
 * Structure:
 *   1. Header: category label + step number + tier accent
 *   2. Problem statement (1-2 lines)
 *   3. Why change? (collapsible bullet list)
 *   4. Design strategy + benefits
 *   5. Product section (available) or Action guidance (custom_order/architectural)
 *   6. Accept/Reject toggle at bottom
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Check,
  Minus,
  ChevronDown,
  ChevronLeft,
  Wrench,
} from 'lucide-react';
import { ImageWithFallback } from '@components/figma/ImageWithFallback';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import {
  type CategoryGroup,
  TIER_CONFIG,
  ACTION_DIFFICULTY_MAP,
} from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RecommendationCardProps {
  group: CategoryGroup;
  stepNumber?: number;
  // State
  isAccepted: boolean;
  isWhyExpanded: boolean;
  isCollapsed: boolean;
  quantity: number;
  basketProductIds: Set<string>;
  productQuantityOverrides: Map<string, number>;
  // Handlers
  onToggleAccept: () => void;
  onToggleWhy: () => void;
  onToggleCollapsed: () => void;
  onProductClick: (product: Product) => void;
  onQuantityChange?: (newQuantity: number) => void;
  toggleBasketProduct: (productId: string) => void;
  setProductQuantity: (productId: string, newQuantity: number) => void;
}

// ---------------------------------------------------------------------------
// Match score color helper
// ---------------------------------------------------------------------------

function matchScoreColor(score: number | undefined): string {
  if (!score) return 'var(--color-editorial-taupe)';
  if (score >= 85) return 'var(--color-feedback-good)';
  if (score >= 65) return 'var(--color-feedback-neutral)';
  return 'var(--color-feedback-bad)';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RecommendationCard({
  group,
  stepNumber,
  isAccepted,
  isWhyExpanded,
  isCollapsed,
  quantity,
  basketProductIds,
  productQuantityOverrides,
  onToggleAccept,
  onToggleWhy,
  onToggleCollapsed,
  onProductClick,
  onQuantityChange,
  toggleBasketProduct,
  setProductQuantity,
}: RecommendationCardProps) {
  const { t } = useTranslation();

  const heroProduct = group.products[0] || null;
  const alternativeProducts = group.products.slice(1, 4);
  const hasProduct = group.actionStatus === 'available' && !!heroProduct;
  const isActionItem =
    group.actionStatus === 'custom_order' || group.actionStatus === 'architectural';
  const tierCfg = TIER_CONFIG[group.interventionTier];
  const hasMultipleQuantity = quantity > 1;
  const isHeroInBasket = heroProduct ? basketProductIds.has(heroProduct.id) : false;

  return (
    <article
      id={`recommendation-${group.itemId}`}
      className="flex flex-col"
    >
      {/* ===== 1. Header: category + step + tier accent ===== */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggleCollapsed}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggleCollapsed()}
        style={{
          marginBottom: isCollapsed ? 0 : 'var(--spacing-sm, 8px)',
          paddingBottom: 'var(--spacing-xs, 4px)',
          borderBottom: '1px solid var(--color-editorial-hairline)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Tier accent bar */}
          <span
            className="shrink-0 rounded-full"
            style={{
              width: 4,
              height: 20,
              background: tierCfg.color,
            }}
          />
          <span
            className="truncate"
            style={{
              fontSize: 'var(--text-h3-size, 16px)',
              fontWeight: 600,
              color: 'var(--color-editorial-charcoal)',
              letterSpacing: '-0.01em',
            }}
          >
            {group.categoryDisplay}
          </span>
          {/* Intervention tier badge */}
          {group.interventionTier !== 'quick_win' && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: tierCfg.color,
                background: tierCfg.bg,
                padding: '2px 8px',
                letterSpacing: '0.02em',
              }}
            >
              {tierCfg.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {stepNumber != null && (
            <span
              className="tabular-nums"
              dir="ltr"
              style={{
                fontSize: 'var(--text-caption-size, 12px)',
                fontStyle: 'italic',
                color: 'var(--color-editorial-taupe)',
                opacity: 0.6,
              }}
            >
              {String(stepNumber).padStart(2, '0')}
            </span>
          )}
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className="transition-transform duration-300"
            style={{
              color: 'var(--color-editorial-taupe)',
              transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>

      {/* ===== Collapsible body ===== */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* ---- 2. Problem statement ---- */}
            {group.problemStatement && (
              <p
                style={{
                  fontSize: 'var(--text-caption-size, 12px)',
                  color: 'var(--color-editorial-taupe)',
                  lineHeight: 1.7,
                  margin: '0 0 var(--spacing-sm, 8px) 0',
                }}
              >
                {group.problemStatement}
              </p>
            )}

            {/* ---- 3. Why change? (collapsible) ---- */}
            {group.whyChangeReasons.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-sm, 8px)' }}>
                <button
                  onClick={onToggleWhy}
                  className="flex items-center gap-1 underline underline-offset-4 transition-colors"
                  style={{
                    fontSize: 'var(--text-caption-size, 12px)',
                    color: 'var(--color-editorial-taupe)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  {isWhyExpanded
                    ? t('studio.result.v2.card.whyClose', 'بستن توضیحات')
                    : t('studio.result.v2.card.whyOpen', 'چرا این انتخاب؟')}
                </button>

                <AnimatePresence initial={false}>
                  {isWhyExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div
                        style={{
                          marginTop: 'var(--spacing-xs, 4px)',
                          padding: 'var(--spacing-sm, 8px)',
                          background: 'var(--color-editorial-stone)',
                        }}
                      >
                        <ul className="list-disc list-inside space-y-1">
                          {group.whyChangeReasons.map((reason, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: 'var(--text-caption-size, 12px)',
                                color: 'var(--color-editorial-charcoal)',
                                lineHeight: 1.6,
                              }}
                            >
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ---- 4. Design strategy + benefits ---- */}
            {group.designStrategy && (
              <div style={{ marginBottom: 'var(--spacing-sm, 8px)' }}>
                <p
                  style={{
                    fontSize: 'var(--text-label-size, 14px)',
                    fontWeight: 600,
                    color: 'var(--color-editorial-charcoal)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {group.designStrategy}
                </p>
                {group.designStrategyBenefits.length > 0 && (
                  <div
                    className="flex flex-col"
                    style={{ gap: 6, marginTop: 'var(--spacing-xs, 4px)' }}
                  >
                    {group.designStrategyBenefits.map((benefit, i) => (
                      <div key={i} className="flex items-start" style={{ gap: 6 }}>
                        <Check
                          size={12}
                          strokeWidth={2.5}
                          className="shrink-0"
                          style={{ color: tierCfg.color, marginTop: 3 }}
                        />
                        <span
                          style={{
                            fontSize: 'var(--text-caption-size, 12px)',
                            color: 'var(--color-editorial-charcoal)',
                            lineHeight: 1.5,
                          }}
                        >
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== 5. Product section (available items) ===== */}
            {hasProduct && heroProduct && (
              <div className="flex flex-col" style={{ gap: 'var(--spacing-sm, 8px)' }}>
                {/* Hero product image */}
                <div
                  className="relative w-full overflow-hidden cursor-pointer group"
                  style={{ background: 'var(--color-editorial-product-bg)' }}
                  onClick={() => onProductClick(heroProduct)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onProductClick(heroProduct)}
                  aria-label={`${t('studio.result.v2.card.viewDetails', 'مشاهده جزئیات')} ${heroProduct.name}`}
                >
                  <ImageWithFallback
                    src={heroProduct.image}
                    alt={heroProduct.name}
                    className="w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                    style={{ aspectRatio: '4 / 5', mixBlendMode: 'multiply' }}
                  />

                  {/* Match score badge */}
                  {heroProduct.matchScore != null && heroProduct.matchScore > 0 && (
                    <div
                      className="absolute flex items-center gap-1"
                      style={{
                        top: 'var(--spacing-xs, 4px)',
                        right: 'var(--spacing-xs, 4px)',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <span
                        className="rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: matchScoreColor(heroProduct.matchScore),
                        }}
                      />
                      <span
                        style={{
                          fontSize: 'var(--text-caption-size, 12px)',
                          fontWeight: 600,
                          color: 'var(--color-editorial-charcoal)',
                        }}
                      >
                        {toLocalizedDigits(heroProduct.matchScore)}%
                      </span>
                    </div>
                  )}

                  {/* Quantity badge */}
                  {hasMultipleQuantity && (
                    <div
                      className="absolute flex items-center"
                      style={{
                        bottom: 'var(--spacing-xs, 4px)',
                        left: 'var(--spacing-xs, 4px)',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(8px)',
                        fontSize: 'var(--text-caption-size, 12px)',
                        fontWeight: 600,
                        color: 'var(--color-editorial-charcoal)',
                        gap: 4,
                      }}
                    >
                      {toLocalizedDigits(quantity)} {t('studio.result.v2.card.pcs', 'عدد')}
                    </div>
                  )}
                </div>

                {/* Product name + price + shop */}
                <div className="flex flex-col" style={{ gap: 4 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-label-size, 14px)',
                      color: 'var(--color-editorial-charcoal)',
                      lineHeight: 1.5,
                    }}
                  >
                    {heroProduct.name}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 'var(--text-caption-size, 12px)',
                      color: 'var(--color-editorial-taupe)',
                      lineHeight: 1.5,
                    }}
                  >
                    {hasMultipleQuantity
                      ? `${formatPriceFromRial(heroProduct.price, true)} \u00D7 ${toLocalizedDigits(quantity)}`
                      : formatPriceFromRial(heroProduct.price, true)}
                  </span>
                  {hasMultipleQuantity && (
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 'var(--text-caption-size, 12px)',
                        fontWeight: 600,
                        color: 'var(--color-editorial-charcoal)',
                      }}
                    >
                      {t('studio.result.v2.card.total', 'جمع')}: {formatPriceFromRial(heroProduct.price * quantity, true)}
                    </span>
                  )}
                  {heroProduct.store && (
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-editorial-taupe)',
                        opacity: 0.7,
                      }}
                    >
                      {heroProduct.store}
                    </span>
                  )}
                </div>

                {/* CTA row: quantity + basket toggle */}
                <div
                  className="flex items-stretch"
                  style={{ gap: 'var(--spacing-xs, 4px)', marginTop: 'var(--spacing-xs, 4px)' }}
                >
                  {/* Quantity stepper */}
                  {onQuantityChange && (
                    <div
                      className="flex items-center"
                      style={{
                        height: 40,
                        padding: '0 var(--spacing-xs, 4px)',
                        border: '1px solid var(--color-editorial-hairline)',
                      }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuantityChange(quantity - 1); }}
                        disabled={quantity <= 1}
                        className="flex items-center justify-center w-7 h-full disabled:opacity-30"
                        style={{ color: 'var(--color-editorial-taupe)' }}
                        aria-label={t('studio.result.v2.card.decreaseQty', 'کاهش تعداد')}
                      >
                        <Minus size={13} />
                      </button>
                      <span
                        className="w-7 text-center tabular-nums"
                        style={{
                          fontSize: 'var(--text-caption-size, 12px)',
                          fontWeight: 600,
                          color: 'var(--color-editorial-charcoal)',
                        }}
                      >
                        {toLocalizedDigits(quantity)}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onQuantityChange(quantity + 1); }}
                        disabled={quantity >= 99}
                        className="flex items-center justify-center w-7 h-full disabled:opacity-30"
                        style={{ color: 'var(--color-editorial-charcoal)' }}
                        aria-label={t('studio.result.v2.card.increaseQty', 'افزایش تعداد')}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  )}

                  {/* Basket toggle (hero product) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBasketProduct(heroProduct.id); }}
                    className="flex-1 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
                    style={{
                      height: 40,
                      fontSize: 'var(--text-caption-size, 12px)',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      backgroundColor: isHeroInBasket ? 'transparent' : 'var(--color-editorial-charcoal)',
                      color: isHeroInBasket ? 'var(--color-editorial-charcoal)' : '#FAFAF8',
                      border: '1px solid var(--color-editorial-charcoal)',
                    }}
                  >
                    {isHeroInBasket ? (
                      <>
                        <Check size={14} strokeWidth={2} />
                        <span>{t('studio.result.v2.card.inBasket', 'در سبد خرید')}</span>
                      </>
                    ) : (
                      t('studio.result.v2.card.addToBasket', 'افزودن به سبد')
                    )}
                  </button>
                </div>

                {/* Alternatives row (up to 3 circular thumbnails) */}
                {alternativeProducts.length > 0 && (
                  <div
                    className="flex flex-col"
                    style={{
                      borderTop: '1px solid var(--color-editorial-hairline)',
                      marginTop: 'var(--spacing-md, 16px)',
                      paddingTop: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <div
                      className="flex items-center justify-between"
                      style={{ marginBottom: 'var(--spacing-sm, 8px)' }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-caption-size, 12px)',
                          color: 'var(--color-editorial-charcoal)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {t('studio.result.v2.card.alternatives', 'سایر گزینه‌ها')}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-caption-size, 12px)',
                          color: 'var(--color-editorial-taupe)',
                        }}
                      >
                        {toLocalizedDigits(alternativeProducts.length)}{' '}
                        {t('studio.result.v2.card.items', 'مورد')}
                      </span>
                    </div>

                    {/* Horizontal scroll of alternatives */}
                    <div
                      className="flex overflow-x-auto"
                      style={{
                        gap: 'var(--spacing-sm, 8px)',
                        paddingBottom: 4,
                        scrollbarWidth: 'none',
                      }}
                    >
                      {alternativeProducts.map((alt) => {
                        const altInBasket = basketProductIds.has(alt.id);
                        const altQty = productQuantityOverrides.get(alt.id) ?? 1;

                        return (
                          <div
                            key={alt.id}
                            className="flex flex-col shrink-0 cursor-pointer group/alt"
                            style={{ width: 120 }}
                          >
                            {/* Thumbnail */}
                            <div
                              className="relative w-full overflow-hidden"
                              style={{
                                background: 'var(--color-editorial-product-bg)',
                                marginBottom: 'var(--spacing-xs, 4px)',
                              }}
                              onClick={() => onProductClick(alt)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && onProductClick(alt)}
                            >
                              <ImageWithFallback
                                src={alt.image}
                                alt={alt.name}
                                className="w-full object-cover transition-transform duration-700 group-hover/alt:scale-[1.03]"
                                style={{ aspectRatio: '3 / 4', mixBlendMode: 'multiply' }}
                              />

                              {/* Circle add/check button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBasketProduct(alt.id);
                                }}
                                className="absolute flex items-center justify-center transition-all active:scale-90"
                                style={{
                                  bottom: 'var(--spacing-xs, 4px)',
                                  left: 'var(--spacing-xs, 4px)',
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: altInBasket
                                    ? 'var(--color-editorial-charcoal)'
                                    : 'rgba(255,255,255,0.92)',
                                  color: altInBasket
                                    ? '#FAFAF8'
                                    : 'var(--color-editorial-charcoal)',
                                  border: altInBasket
                                    ? '1px solid var(--color-editorial-charcoal)'
                                    : '1px solid var(--color-editorial-hairline)',
                                }}
                                aria-label={altInBasket
                                  ? t('studio.result.v2.card.removeFromBasket', 'حذف از سبد')
                                  : t('studio.result.v2.card.addToBasket', 'افزودن به سبد')
                                }
                              >
                                {altInBasket
                                  ? <Check size={13} strokeWidth={2} />
                                  : <Plus size={13} strokeWidth={2} />
                                }
                              </button>
                            </div>

                            {/* Name */}
                            <span
                              className="line-clamp-2"
                              style={{
                                fontSize: 'var(--text-caption-size, 12px)',
                                color: 'var(--color-editorial-charcoal)',
                                lineHeight: 1.4,
                                marginBottom: 2,
                              }}
                            >
                              {alt.name}
                            </span>

                            {/* Price */}
                            <span
                              className="tabular-nums"
                              style={{
                                fontSize: 'var(--text-caption-size, 12px)',
                                color: 'var(--color-editorial-taupe)',
                                lineHeight: 1.4,
                              }}
                            >
                              {formatPriceFromRial(alt.price, true)}
                            </span>

                            {/* Per-product quantity (only if in basket) */}
                            {altInBasket && (
                              <div
                                className="flex items-center justify-center"
                                style={{
                                  marginTop: 4,
                                  gap: 4,
                                }}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); setProductQuantity(alt.id, altQty - 1); }}
                                  disabled={altQty <= 1}
                                  className="flex items-center justify-center w-5 h-5 disabled:opacity-30"
                                  style={{ color: 'var(--color-editorial-taupe)' }}
                                  aria-label={t('studio.result.v2.card.decreaseQty', 'کاهش تعداد')}
                                >
                                  <Minus size={10} />
                                </button>
                                <span
                                  className="tabular-nums"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--color-editorial-charcoal)',
                                    minWidth: 14,
                                    textAlign: 'center',
                                  }}
                                >
                                  {toLocalizedDigits(altQty)}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setProductQuantity(alt.id, altQty + 1); }}
                                  disabled={altQty >= 99}
                                  className="flex items-center justify-center w-5 h-5 disabled:opacity-30"
                                  style={{ color: 'var(--color-editorial-charcoal)' }}
                                  aria-label={t('studio.result.v2.card.increaseQty', 'افزایش تعداد')}
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== 6. Action guidance (custom_order / architectural) ===== */}
            {isActionItem && (() => {
              const difficultyConfig = group.actionDifficulty
                ? ACTION_DIFFICULTY_MAP[group.actionDifficulty]
                : null;
              const DifficultyIcon = difficultyConfig?.icon || Wrench;

              return (
                <div className="flex flex-col">
                  {/* Reference image */}
                  {group.referenceImageUrl && (
                    <div
                      className="relative w-full overflow-hidden"
                      style={{
                        background: 'var(--color-editorial-product-bg)',
                        marginBottom: 'var(--spacing-sm, 8px)',
                      }}
                    >
                      <ImageWithFallback
                        src={group.referenceImageUrl}
                        alt={group.categoryDisplay}
                        className="w-full object-cover"
                        style={{ aspectRatio: '16 / 10' }}
                      />
                      {/* Action type badge */}
                      <div
                        className="absolute flex items-center gap-1"
                        style={{
                          top: 'var(--spacing-xs, 4px)',
                          right: 'var(--spacing-xs, 4px)',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <DifficultyIcon
                          size={11}
                          strokeWidth={2}
                          style={{ color: difficultyConfig?.color || 'var(--color-editorial-taupe)' }}
                        />
                        <span
                          style={{
                            fontSize: 'var(--text-caption-size, 12px)',
                            fontWeight: 600,
                            color: 'var(--color-editorial-charcoal)',
                          }}
                        >
                          {group.actionType || (group.actionStatus === 'architectural'
                            ? t('studio.result.v2.card.architectural', 'مداخله معماری')
                            : t('studio.result.v2.card.enhancement', 'بهبود فضا')
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Difficulty + Estimate metadata */}
                  <div
                    className="flex items-center flex-wrap"
                    style={{
                      gap: 'var(--spacing-xs, 4px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                      paddingBottom: 'var(--spacing-sm, 8px)',
                      borderBottom: '1px solid var(--color-editorial-hairline)',
                    }}
                  >
                    {difficultyConfig && (
                      <span
                        className="inline-flex items-center gap-1"
                        style={{
                          padding: '4px 10px',
                          background: difficultyConfig.bg,
                        }}
                      >
                        <DifficultyIcon
                          size={11}
                          strokeWidth={2}
                          style={{ color: difficultyConfig.color }}
                        />
                        <span
                          style={{
                            fontSize: 'var(--text-caption-size, 12px)',
                            color: 'var(--color-editorial-charcoal)',
                          }}
                        >
                          {difficultyConfig.label}
                        </span>
                      </span>
                    )}
                    {group.actionEstimate && (
                      <span
                        className="inline-flex items-center gap-1 tabular-nums"
                        style={{
                          padding: '4px 10px',
                          background: 'var(--color-surface-muted, #f5f5f3)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 'var(--text-caption-size, 12px)',
                            color: 'var(--color-editorial-taupe)',
                          }}
                        >
                          {t('studio.result.v2.card.estimatedCost', 'هزینه تخمینی')}:
                        </span>
                        <span
                          style={{
                            fontSize: 'var(--text-caption-size, 12px)',
                            fontWeight: 600,
                            color: 'var(--color-editorial-charcoal)',
                          }}
                        >
                          {toLocalizedDigits(group.actionEstimate)}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Expandable guidance */}
                  {group.actionGuidance && (
                    <ActionGuidance guidance={group.actionGuidance} />
                  )}

                  {/* Spec note */}
                  {group.specNote && (
                    <p
                      className="tabular-nums"
                      dir="ltr"
                      style={{
                        fontSize: 'var(--text-caption-size, 12px)',
                        color: 'var(--color-editorial-taupe)',
                        margin: '0 0 var(--spacing-sm, 8px) 0',
                        letterSpacing: '0.04em',
                        textAlign: 'start',
                      }}
                    >
                      {group.specNote}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* ===== 7. Accept/Reject toggle ===== */}
            <button
              onClick={onToggleAccept}
              className="w-full flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
              style={{
                height: 40,
                marginTop: 'var(--spacing-xs, 4px)',
                fontSize: 'var(--text-caption-size, 12px)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                backgroundColor: isAccepted ? 'transparent' : 'var(--color-editorial-charcoal)',
                color: isAccepted ? 'var(--color-editorial-charcoal)' : '#FAFAF8',
                border: '1px solid var(--color-editorial-charcoal)',
              }}
            >
              {isAccepted ? (
                <>
                  <Check size={14} strokeWidth={2} />
                  <span>
                    {isActionItem
                      ? t('studio.result.v2.card.consultRequested', 'ثبت شد — در انتظار مشاوره')
                      : t('studio.result.v2.card.accepted', 'پذیرفته شد')
                    }
                  </span>
                </>
              ) : (
                isActionItem
                  ? t('studio.result.v2.card.requestConsult', 'درخواست مشاوره')
                  : t('studio.result.v2.card.accept', 'تایید پیشنهاد')
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Action guidance expandable sub-component
// ---------------------------------------------------------------------------

function ActionGuidance({ guidance }: { guidance: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: 'var(--spacing-sm, 8px)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 transition-colors"
        style={{
          fontSize: 'var(--text-caption-size, 12px)',
          fontWeight: 600,
          color: 'var(--color-editorial-charcoal)',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <ChevronLeft
          size={14}
          strokeWidth={1.5}
          className="transition-transform duration-300"
          style={{ transform: open ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        />
        {t('studio.result.v2.card.guidanceToggle', 'جزئیات طرح پیشنهادی')}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              style={{
                marginTop: 'var(--spacing-xs, 4px)',
                padding: 'var(--spacing-sm, 8px)',
                background: 'var(--color-editorial-stone)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--text-caption-size, 12px)',
                  color: 'var(--color-editorial-charcoal)',
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                {guidance}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
