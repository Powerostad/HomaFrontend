/**
 * RecommendationCard — Zara Home Editorial Product Card
 *
 * Matches the Zara Home PDP reference:
 *   - Clean edge-to-edge product images
 *   - CATEGORY | NAME title pattern
 *   - Black CTA button + outlined ♡ action
 *   - Circle ⊕ buttons on alternative thumbnails
 *   - Rich editorial action items (enhancement/structural) with
 *     reference image, design strategy, difficulty/estimate metadata,
 *     expandable guidance, spec note, and consultation CTA
 *
 * All styling uses CSS variables from globals.css.
 * Only Vazirmatn + Playfair Display fonts used.
 */
import { useState } from 'react';
import {
  Plus,
  Check,
  Minus,
  X,
  ChevronRight,
  ChevronDown,
  Heart,
  Share2,
  MoreHorizontal,
  ShoppingBag,
  Phone,
  Wrench,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import { type CategoryGroup, type InterventionTier, ACTION_DIFFICULTY_MAP } from './types';

const FONT = 'var(--font-family-vazirmatn)';
const FONT_SERIF = 'var(--font-family-serif)';

/* ─── Match score colour helper ─── */
function matchScoreColor(score: number | undefined): string {
  if (!score) return 'var(--editorial-taupe)';
  if (score >= 85) return 'var(--feedback-good)';
  if (score >= 65) return 'var(--feedback-neutral)';
  return 'var(--feedback-bad)';
}

/* =============================================
   Main Card
   ============================================= */

interface RecommendationCardProps {
  group: CategoryGroup;
  tier: InterventionTier;
  isTopPriority: boolean;
  priorityRank: number;
  stepNumber?: number;
  isWhyExpanded: boolean;
  isSaved: boolean;
  isAccepted?: boolean;
  sessionId?: string;
  basketProductIds: Set<string>;
  onToggleWhy: () => void;
  onProductClick: (product: Product) => void;
  onToggleSaved: () => void;
  onToggleAccepted?: () => void;
  onToggleBasketProduct: (productId: string) => void;
  onScrollToAnalysis?: () => void;
  onUpdateQuantity?: (newQuantity: number) => void;
  isLast?: boolean;
}

export function RecommendationCard({
  group,
  stepNumber,
  isWhyExpanded,
  isAccepted,
  basketProductIds,
  onToggleWhy,
  onProductClick,
  onToggleAccepted,
  onToggleBasketProduct,
  onUpdateQuantity,
}: RecommendationCardProps) {
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = group.categoryDisplay || 'پیشنهاد طراحی';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      /* user cancelled or unsupported */
    }
  };

  const heroProduct = group.products[0] || null;
  const alternativeProducts = group.products.slice(1, 5);
  const hasProduct = group.actionStatus === 'available' && !!heroProduct;
  const isActionItem =
    group.actionStatus === 'custom_order' || group.actionStatus === 'architectural';
  const quantity = group.quantity || 1;
  const hasMultipleQuantity = quantity > 1;
  const isHeroInBasket = heroProduct ? basketProductIds.has(heroProduct.id) : false;

  return (
    <article
      id={`recommendation-${group.itemId}`}
      className="flex flex-col"
      style={{ fontFamily: FONT }}
    >
      {/* ═══════ A) Category label ═══════ */}
      {isActionItem ? (
        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
          <div
            className="flex items-center justify-between"
            style={{ paddingBottom: '6px' }}
          >
            <span
              style={{
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT,
                color: 'var(--editorial-taupe)',
                letterSpacing: '0.04em',
              }}
            >
              {group.actionType || 'اقدام پیشنهادی'}
            </span>
            {stepNumber != null && (
              <span
                className="tabular-nums"
                dir="ltr"
                style={{
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  fontFamily: FONT_SERIF,
                  fontStyle: 'italic',
                  color: 'var(--editorial-taupe)',
                  opacity: 0.5,
                }}
              >
                {String(stepNumber).padStart(2, '0')}
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: 'var(--text-h3-size)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: FONT,
              color: 'var(--editorial-charcoal)',
              lineHeight: 1.4,
              margin: 0,
              paddingBottom: 'var(--spacing-xs)',
              borderBottom: '1px solid var(--editorial-hairline)',
            }}
          >
            {group.categoryDisplay}
          </h3>
        </div>
      ) : (
        <div
          className="flex items-center justify-between"
          style={{
            marginBottom: 'var(--spacing-sm)',
            paddingBottom: 'var(--spacing-xs)',
            borderBottom: '1px solid var(--editorial-hairline)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-h2-size)',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-charcoal)',
              letterSpacing: '-0.01em',
            }}
          >
            {group.categoryDisplay}
          </span>
          {stepNumber != null && (
            <span
              className="tabular-nums"
              dir="ltr"
              style={{
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT_SERIF,
                fontStyle: 'italic',
                color: 'var(--editorial-taupe)',
                opacity: 0.6,
              }}
            >
              {String(stepNumber).padStart(2, '0')}
            </span>
          )}
        </div>
      )}

      {/* ═══════ B) Hero Product ═══════ */}
      {hasProduct && heroProduct && (
        <div className="flex flex-col" style={{ gap: 'var(--spacing-sm)' }}>
          {/* ── Hero Image ── */}
          <div
            className="relative w-full overflow-hidden cursor-pointer group"
            style={{
              background: 'var(--editorial-product-bg)',
              borderRadius: '0px',
            }}
            onClick={() => onProductClick(heroProduct)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onProductClick(heroProduct)}
            aria-label={`مشاهده جزئیات ${heroProduct.name}`}
          >
            <ImageWithFallback
              src={heroProduct.image}
              alt={heroProduct.name}
              className="w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
              style={{ aspectRatio: '4 / 5', mixBlendMode: 'multiply' }}
            />

            {/* Smart Choice badge */}
            {heroProduct.matchScore != null && heroProduct.matchScore > 0 && (
              <div
                className="absolute"
                style={{
                  top: 'var(--spacing-xs)',
                  right: 'var(--spacing-xs)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontFamily: FONT,
                    color: 'var(--editorial-charcoal)',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(var(--blur-sm))',
                    padding: '4px var(--spacing-xs)',
                    letterSpacing: '0.04em',
                  }}
                >
                  انتخاب هوشمند
                </span>
              </div>
            )}

            {/* Quantity badge */}
            {hasMultipleQuantity && (
              <div
                className="absolute flex items-center"
                style={{
                  bottom: 'var(--spacing-xs)',
                  left: 'var(--spacing-xs)',
                  padding: '4px var(--spacing-xs)',
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(var(--blur-sm))',
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: FONT,
                  color: 'var(--editorial-charcoal)',
                  gap: '4px',
                }}
              >
                {toLocalizedDigits(quantity)} عدد
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-col" style={{ gap: '4px' }}>
            {/* Category | Name */}
            <span
              style={{
                fontSize: 'var(--text-label-size)',
                fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT,
                color: 'var(--editorial-charcoal)',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
              }}
            >
              {heroProduct.name}
            </span>

            {/* Price */}
            <span
              className="tabular-nums"
              style={{
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT,
                color: 'var(--editorial-taupe)',
                lineHeight: 1.5,
              }}
            >
              {hasMultipleQuantity
                ? `${formatPriceFromRial(heroProduct.price, true)} × ${toLocalizedDigits(quantity)}`
                : formatPriceFromRial(heroProduct.price, true)}
            </span>

            {hasMultipleQuantity && (
              <span
                className="tabular-nums"
                style={{
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: FONT,
                  color: 'var(--editorial-charcoal)',
                }}
              >
                جمع: {formatPriceFromRial(heroProduct.price * quantity, true)}
              </span>
            )}
          </div>

          {/* ── CTA Row: Black button + Heart ── */}
          <div
            className="flex items-stretch"
            style={{ gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}
          >
            {/* Quantity stepper (if adjustable) */}
            {onUpdateQuantity && (
              <div
                className="flex items-center"
                style={{
                  height: '40px',
                  padding: '0 var(--spacing-xs)',
                  border: '1px solid var(--editorial-hairline)',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateQuantity(quantity - 1);
                  }}
                  disabled={quantity <= 1}
                  className="flex items-center justify-center w-7 h-full disabled:opacity-30"
                  style={{ color: 'var(--editorial-taupe)' }}
                  aria-label="کاهش تعداد"
                >
                  <Minus size={13} />
                </button>
                <span
                  className="w-7 text-center tabular-nums"
                  style={{
                    fontFamily: FONT,
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--editorial-charcoal)',
                  }}
                >
                  {toLocalizedDigits(quantity)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateQuantity(quantity + 1);
                  }}
                  disabled={quantity >= 99}
                  className="flex items-center justify-center w-7 h-full disabled:opacity-30"
                  style={{ color: 'var(--editorial-charcoal)' }}
                  aria-label="افزایش تعداد"
                >
                  <Plus size={13} />
                </button>
              </div>
            )}

            {/* Add/Remove Button — Solid black / outlined */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBasketProduct(heroProduct.id);
              }}
              className="flex-1 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
              style={{
                height: '40px',
                fontFamily: FONT,
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-semibold)',
                letterSpacing: '0.04em',
                backgroundColor: isHeroInBasket
                  ? 'transparent'
                  : 'var(--editorial-charcoal)',
                color: isHeroInBasket
                  ? 'var(--editorial-charcoal)'
                  : 'var(--btn-dark-text)',
                border: '1px solid var(--editorial-charcoal)',
                borderRadius: '0px',
              }}
            >
              {isHeroInBasket ? (
                <>
                  <Check size={14} strokeWidth={2} />
                  <span>در سبد خرید</span>
                </>
              ) : (
                'افزودن به سبد'
              )}
            </button>

            {/* Heart button — outlined square like Zara Home */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center transition-all active:scale-95"
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid var(--editorial-hairline)',
                borderRadius: '0px',
                color: 'var(--editorial-charcoal)',
                background: 'transparent',
              }}
              aria-label="علاقه‌مندی"
            >
              <Heart size={18} strokeWidth={1} />
            </button>
          </div>

          {/* ═══════ C) Alternatives — COMPLETE THE LOOK ═══════ */}
          {alternativeProducts.length > 0 && (
            <div
              className="flex flex-col"
              style={{
                borderTop: '1px solid var(--editorial-hairline)',
                marginTop: 'var(--spacing-lg)',
                paddingTop: 'var(--spacing-md)',
              }}
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 'var(--spacing-sm)' }}
              >
                <span
                  style={{
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-regular)',
                    fontFamily: FONT,
                    color: 'var(--editorial-charcoal)',
                    letterSpacing: '0.04em',
                  }}
                >
                  سایر گزینه‌ها
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-regular)',
                    fontFamily: FONT,
                    color: 'var(--editorial-taupe)',
                  }}
                >
                  {toLocalizedDigits(alternativeProducts.length)} مورد
                </span>
              </div>

              {/* Horizontal Scroll */}
              <div
                className="flex overflow-x-auto"
                style={{
                  gap: 'var(--spacing-sm)',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>{`
                  .alt-scroll-zh::-webkit-scrollbar { display: none; }
                `}</style>
                {alternativeProducts.map((alt) => (
                  <div
                    key={alt.id}
                    style={{ minWidth: '150px', maxWidth: '150px' }}
                  >
                    <AlternativeCard
                      product={alt}
                      isInBasket={basketProductIds.has(alt.id)}
                      onTap={() => setSheetProduct(alt)}
                      onToggleBasket={() => onToggleBasketProduct(alt.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ Action Item (non-product) ═══════ */}
      {isActionItem && (() => {
        const difficultyKey = group.interventionTier === 'structural'
          ? 'professional'
          : group.interventionTier === 'enhancement'
            ? 'moderate'
            : 'simple';
        const difficultyConfig = ACTION_DIFFICULTY_MAP[difficultyKey];
        const DifficultyIcon = difficultyConfig?.icon || Wrench;

        return (
          <div className="flex flex-col">
            {/* ── Reasoning ── */}
            {group.designRationaleFa && (
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--editorial-taupe)',
                  lineHeight: 1.7,
                  margin: '0 0 var(--spacing-sm) 0',
                }}
              >
                {group.designRationaleFa}
              </p>
            )}

            {/* ── Recommendation reason ── */}
            {group.recommendationReasonFa && (
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <p
                  style={{
                    fontFamily: FONT,
                    fontSize: 'var(--text-label-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--editorial-charcoal)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {group.recommendationReasonFa}
                </p>
                {group.placements && group.placements.length > 0 && (
                  <div className="flex flex-col" style={{ gap: '6px', marginTop: 'var(--spacing-xs)' }}>
                    {group.placements.map((placement: string, i: number) => (
                      <div key={i} className="flex items-start" style={{ gap: '6px' }}>
                        <Check size={12} strokeWidth={2.5} className="shrink-0" style={{ color: difficultyConfig?.color || 'var(--feedback-good)', marginTop: '3px' }} />
                        <span style={{ fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)', color: 'var(--editorial-charcoal)', lineHeight: 1.5 }}>
                          {placement}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Metadata Row ── */}
            <div className="flex items-center flex-wrap" style={{ gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)', borderBottom: '1px solid var(--editorial-hairline)' }}>
              {difficultyConfig && (
                <span className="inline-flex items-center" style={{ padding: '4px 10px', background: difficultyConfig.bg, gap: '4px' }}>
                  <DifficultyIcon size={11} strokeWidth={2} style={{ color: difficultyConfig.color }} />
                  <span style={{ fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)', color: 'var(--editorial-charcoal)' }}>
                    {difficultyConfig.label}
                  </span>
                </span>
              )}
              {group.impactLevel && (
                <span className="inline-flex items-center tabular-nums" style={{ padding: '4px 10px', background: 'var(--muted)', gap: '4px' }}>
                  <span style={{ fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)', color: 'var(--editorial-taupe)' }}>
                    سطح تاثیر:
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--editorial-charcoal)' }}>
                    {group.impactLevel === 'high' ? 'بالا' : group.impactLevel === 'medium' ? 'متوسط' : 'پایین'}
                  </span>
                </span>
              )}
            </div>

            {group.actionGuidance && (
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <button onClick={() => setShowGuidance(!showGuidance)} className="flex items-center transition-colors w-full" style={{ fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--editorial-charcoal)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', gap: '4px' }}>
                  {showGuidance ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                  جزئیات طرح پیشنهادی
                </button>
                {showGuidance && (
                  <div style={{ marginTop: 'var(--spacing-xs)', padding: 'var(--spacing-sm)', background: 'var(--editorial-stone)' }}>
                    <p style={{ fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)', color: 'var(--editorial-charcoal)', lineHeight: 1.8, margin: 0 }}>
                      {group.actionGuidance}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-stretch" style={{ gap: 'var(--spacing-xs)' }}>
              <button onClick={() => onToggleAccepted?.()} className="flex-1 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]" style={{ height: '40px', fontFamily: FONT, fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-semibold)', letterSpacing: '0.04em', backgroundColor: isAccepted ? 'transparent' : 'var(--editorial-charcoal)', color: isAccepted ? 'var(--editorial-charcoal)' : 'var(--btn-dark-text)', border: '1px solid var(--editorial-charcoal)', borderRadius: '0px' }} aria-label={isAccepted ? 'لغو درخواست مشاوره' : 'درخواست مشاوره'}>
                {isAccepted ? (<><Check size={14} strokeWidth={2} /><span>ثبت شد — در انتظار مشاوره</span></>) : (<><Phone size={14} strokeWidth={2} /><span>درخواست مشاوره</span></>)}
              </button>
              <button onClick={handleShare} className="flex items-center justify-center transition-all active:scale-95" style={{ width: '40px', height: '40px', border: '1px solid var(--editorial-hairline)', borderRadius: '0px', color: 'var(--editorial-charcoal)', background: 'transparent' }} aria-label="اشتراک‌گذاری">
                <Share2 size={18} strokeWidth={1} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ═══════ Why Section ═══════ */}
      {group.recommendationReasonFa && (
        <div style={{ marginTop: 'var(--spacing-sm)' }}>
          <button
            onClick={onToggleWhy}
            className="underline underline-offset-4 transition-colors"
            style={{
              fontFamily: FONT,
              fontSize: 'var(--text-caption-size)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--editorial-taupe)',
            }}
          >
            {isWhyExpanded ? 'بستن توضیحات' : 'چرا این انتخاب؟'}
          </button>
          {isWhyExpanded && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-regular)',
                lineHeight: 1.6,
                backgroundColor: 'var(--editorial-stone)',
                color: 'var(--editorial-charcoal)',
                marginTop: 'var(--spacing-xs)',
                padding: 'var(--spacing-sm)',
              }}
            >
              <p>{group.recommendationReasonFa}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ D) Alternative Bottom Sheet ═══════ */}
      <AlternativeBottomSheet
        product={sheetProduct}
        isOpen={!!sheetProduct}
        isInBasket={sheetProduct ? basketProductIds.has(sheetProduct.id) : false}
        heroName={heroProduct?.name}
        onClose={() => setSheetProduct(null)}
        onToggleBasket={(p) => onToggleBasketProduct(p.id)}
        onViewFull={(p) => {
          setSheetProduct(null);
          onProductClick(p);
        }}
        quantity={quantity}
        onUpdateQuantity={onUpdateQuantity}
      />
    </article>
  );
}

/* =============================================
   AlternativeCard — Zara Home "COMPLETE THE LOOK" item
   ============================================= */
function AlternativeCard({
  product,
  isInBasket,
  onTap,
  onToggleBasket,
}: {
  product: Product & { store?: string; matchScore?: number };
  isInBasket: boolean;
  onTap: () => void;
  onToggleBasket?: () => void;
}) {
  return (
    <div
      className="flex flex-col group/alt cursor-pointer relative"
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onTap();
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: 'var(--editorial-product-bg)',
          marginBottom: 'var(--spacing-xs)',
        }}
      >
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="w-full object-cover transition-transform duration-700 group-hover/alt:scale-[1.03]"
          style={{ aspectRatio: '3 / 4', mixBlendMode: 'multiply' }}
        />

        {/* Circle ⊕ Button — Zara Home style */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBasket?.();
          }}
          className="absolute flex items-center justify-center transition-all active:scale-90"
          style={{
            bottom: 'var(--spacing-xs)',
            left: 'var(--spacing-xs)',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-full)',
            background: isInBasket
              ? 'var(--editorial-charcoal)'
              : 'var(--surface)',
            color: isInBasket ? 'var(--btn-dark-text)' : 'var(--editorial-charcoal)',
            border: isInBasket
              ? '1px solid var(--editorial-charcoal)'
              : '1px solid var(--editorial-hairline)',
            boxShadow: 'var(--elevation-sm)',
          }}
          aria-label={isInBasket ? 'حذف از سبد' : 'افزودن به سبد'}
        >
          {isInBasket ? (
            <Check size={13} strokeWidth={2} />
          ) : (
            <Plus size={13} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Name */}
      <span
        className="line-clamp-2"
        style={{
          fontFamily: FONT,
          fontSize: 'var(--text-caption-size)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--editorial-charcoal)',
          lineHeight: 1.4,
          marginBottom: '2px',
        }}
      >
        {product.name}
      </span>

      {/* Price */}
      <span
        className="tabular-nums"
        style={{
          fontFamily: FONT,
          fontSize: 'var(--text-caption-size)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--editorial-taupe)',
          lineHeight: 1.4,
        }}
      >
        {formatPriceFromRial(product.price, true)}
      </span>
    </div>
  );
}

/* =============================================
   AlternativeBottomSheet — Zara Home PDP style for alternatives
   ============================================= */
function AlternativeBottomSheet({
  product,
  isOpen,
  isInBasket,
  heroName,
  onClose,
  onToggleBasket,
  onViewFull: _onViewFull,
  quantity = 1,
  onUpdateQuantity,
}: {
  product: Product | null;
  isOpen: boolean;
  isInBasket: boolean;
  heroName?: string;
  onClose: () => void;
  onToggleBasket: (product: Product) => void;
  onViewFull: (product: Product) => void;
  quantity?: number;
  onUpdateQuantity?: (newQuantity: number) => void;
}) {
  const [isFav, setIsFav] = useState(false);
  if (!product) return null;

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = product.name || 'محصول جایگزین';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      /* user cancelled or unsupported */
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0 overflow-hidden flex flex-col focus:outline-none max-w-md mx-auto z-[9999]"
        style={{
          backgroundColor: 'var(--card)',
          borderRadius: '0px',
          fontFamily: FONT,
          height: '100dvh',
          maxHeight: '100dvh',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        <div className="sr-only">
          <DialogTitle>جزئیات محصول جایگزین</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </div>

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden relative scroll-smooth pb-32">
          {/* ── Hero Image + Floating Header ── */}
          <div
            className="relative w-full overflow-hidden"
            style={{ background: 'var(--editorial-product-bg)' }}
          >
            {/* Floating header */}
            <div
              className="absolute top-0 inset-x-0 z-20 flex items-center justify-between"
              style={{ padding: 'var(--spacing-sm)' }}
            >
              <button
                onClick={onClose}
                className="flex items-center justify-center transition-all active:scale-95"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface)',
                  color: 'var(--editorial-charcoal)',
                  boxShadow: 'var(--elevation-sm)',
                }}
                aria-label="بستن"
              >
                <X size={18} strokeWidth={1.5} />
              </button>

              <div
                className="flex items-center"
                style={{ gap: 'var(--spacing-xs)' }}
              >
                <button
                  className="flex items-center justify-center transition-all active:scale-95"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--surface)',
                    color: 'var(--editorial-charcoal)',
                    boxShadow: 'var(--elevation-sm)',
                  }}
                  aria-label="گزینه‌های بیشتر"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="flex items-center justify-center transition-all active:scale-95 relative"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--surface)',
                    color: 'var(--editorial-charcoal)',
                    boxShadow: 'var(--elevation-sm)',
                  }}
                  aria-label="سبد خرید"
                >
                  <ShoppingBag size={18} strokeWidth={1.5} />
                  {isInBasket && (
                    <span
                      className="absolute flex items-center justify-center"
                      style={{
                        top: '-2px',
                        left: '-2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--editorial-charcoal)',
                        color: 'var(--btn-dark-text)',
                        fontSize: '9px',
                        fontWeight: 'var(--font-weight-bold)',
                        fontFamily: FONT,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              </div>
            </div>

            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-full object-cover"
              style={{ aspectRatio: '3 / 4', mixBlendMode: 'multiply' }}
            />

            {/* Match Score */}
            {product.matchScore != null && product.matchScore > 0 && (
              <div
                className="absolute flex items-center"
                style={{
                  bottom: 'var(--spacing-sm)',
                  right: 'var(--spacing-sm)',
                  padding: '4px var(--spacing-xs)',
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(var(--blur-sm))',
                  gap: 'var(--spacing-xs)',
                }}
              >
                <span
                  className="rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    background: matchScoreColor(product.matchScore),
                  }}
                />
                <span
                  style={{
                    fontFamily: FONT,
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--editorial-charcoal)',
                  }}
                >
                  {toLocalizedDigits(product.matchScore)}٪ تطابق
                </span>
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div
            style={{
              padding: 'var(--spacing-md) var(--spacing-sm)',
              paddingBottom: 0,
            }}
          >
            {/* Category | Name */}
            <h2
              style={{
                fontFamily: FONT,
                fontSize: 'var(--text-label-size)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--editorial-charcoal)',
                lineHeight: 1.5,
                margin: '0 0 var(--spacing-xs) 0',
              }}
            >
              {product.category || 'جایگزین'} | {product.name}
            </h2>

            {/* Price */}
            <p
              className="tabular-nums"
              style={{
                fontFamily: FONT,
                fontSize: 'var(--text-label-size)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--editorial-taupe)',
                margin: '0 0 var(--spacing-md) 0',
              }}
            >
              {formatPriceFromRial(product.price, true)}
            </p>

            {/* CTA Row */}
            <div
              className="flex items-stretch"
              style={{
                gap: 'var(--spacing-xs)',
                marginBottom: 'var(--spacing-md)',
              }}
            >
              <button
                onClick={() => onToggleBasket(product)}
                className="flex-1 flex items-center justify-center transition-all active:scale-[0.98]"
                style={{
                  height: 'var(--btn-dark-h-mobile)',
                  background: isInBasket
                    ? 'transparent'
                    : 'var(--editorial-charcoal)',
                  color: isInBasket
                    ? 'var(--editorial-charcoal)'
                    : 'var(--btn-dark-text)',
                  border: '1px solid var(--editorial-charcoal)',
                  borderRadius: '0px',
                  fontFamily: FONT,
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-semibold)',
                  letterSpacing: '0.06em',
                }}
              >
                {isInBasket ? (
                  <span
                    className="flex items-center"
                    style={{ gap: 'var(--spacing-xs)' }}
                  >
                    <Check size={15} strokeWidth={2} />
                    در سبد خرید
                  </span>
                ) : (
                  'افزودن به سبد خرید'
                )}
              </button>

              <button
                onClick={() => setIsFav(!isFav)}
                className="flex items-center justify-center transition-all active:scale-95"
                style={{
                  width: 'var(--btn-dark-h-mobile)',
                  height: 'var(--btn-dark-h-mobile)',
                  border: '1px solid var(--editorial-hairline)',
                  borderRadius: '0px',
                  color: 'var(--editorial-charcoal)',
                  background: 'transparent',
                }}
                aria-label="علاقه‌مندی"
              >
                <Heart
                  size={20}
                  strokeWidth={1}
                  className={isFav ? 'fill-current' : ''}
                />
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center transition-all active:scale-95"
                style={{
                  width: 'var(--btn-dark-h-mobile)',
                  height: 'var(--btn-dark-h-mobile)',
                  border: '1px solid var(--editorial-hairline)',
                  borderRadius: '0px',
                  color: 'var(--editorial-charcoal)',
                  background: 'transparent',
                }}
                aria-label="اشتراک‌گذاری"
              >
                <Share2 size={20} strokeWidth={1} />
              </button>
            </div>

            {/* Description */}
            <p
              style={{
                fontFamily: FONT,
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--editorial-charcoal)',
                lineHeight: 1.7,
                margin: '0 0 var(--spacing-md) 0',
              }}
            >
              این محصول به عنوان جایگزین برای{' '}
              {heroName ? `«${heroName}»` : 'محصول اصلی'} پیشنهاد شده است. طراحی
              آن با سبک کلی فضا هماهنگی دارد.
            </p>

            {/* Ref/Store */}
            <div
              style={{
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px solid var(--editorial-hairline)',
              }}
            >
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--editorial-charcoal)',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {product.store && `${product.store} | `}
                {product.category}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ STICKY FOOTER ═══ */}
        {onUpdateQuantity && (
          <div
            className="absolute bottom-0 inset-x-0 z-[100]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              backdropFilter: 'blur(var(--blur-md))',
              borderTop: '1px solid var(--editorial-hairline)',
              padding: 'var(--spacing-sm)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--editorial-taupe)',
                }}
              >
                تعداد
              </span>
              <div
                className="flex items-center"
                style={{
                  border: '1px solid var(--editorial-hairline)',
                  gap: 'var(--spacing-sm)',
                  padding: '6px var(--spacing-xs)',
                }}
              >
                <button
                  onClick={() => onUpdateQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                  className="disabled:opacity-30"
                  aria-label="کاهش تعداد"
                >
                  <Minus size={14} />
                </button>
                <span
                  className="tabular-nums text-center"
                  style={{
                    fontFamily: FONT,
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-semibold)',
                    width: '16px',
                  }}
                >
                  {toLocalizedDigits(quantity)}
                </span>
                <button
                  onClick={() => onUpdateQuantity(quantity + 1)}
                  disabled={quantity >= 99}
                  className="disabled:opacity-30"
                  aria-label="افزایش تعداد"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}