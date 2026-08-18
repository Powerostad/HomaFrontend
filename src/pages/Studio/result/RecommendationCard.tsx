import { Check, ChevronDown, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import type { CategoryGroup, InterventionTier } from './types';

const FONT = 'var(--font-family-vazirmatn)';

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

function impactText(level: CategoryGroup['impactLevel'], t: (key: string, fallback: string) => string) {
  if (level === 'high') return t('studio.result.v2.impact.high', 'اثر بالا');
  if (level === 'medium') return t('studio.result.v2.impact.medium', 'اثر متوسط');
  return t('studio.result.v2.impact.low', 'اثر کم');
}

function ProductPreview({
  product,
  group,
  isSelected,
  isPrimary,
  onOpen,
  onToggle,
}: {
  product: Product & { store?: string; matchScore?: number };
  group: CategoryGroup;
  isSelected: boolean;
  isPrimary: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const reason = product.persianReason || group.recommendationReasonFa || t('studio.result.v2.card.defaultReason', 'با سبک کلی فضا هماهنگ است.');

  return (
    <article className={`studio-product-preview ${isPrimary ? 'is-primary' : ''}`}>
      <button type="button" className="studio-product-image-button" onClick={onOpen} aria-label={`${t('studio.result.v2.card.viewProduct', 'مشاهده جزئیات محصول')}: ${product.name}`}>
        <ImageWithFallback src={product.image} alt={product.name} className="studio-product-image" />
        {isPrimary && <span className="studio-product-badge">{t('studio.result.v2.card.recommendedProduct', 'پیشنهاد اصلی')}</span>}
      </button>
      <div className="studio-product-copy">
        <button type="button" className="studio-product-name" onClick={onOpen}>{product.name}</button>
        <span className="studio-product-reason">{reason}</span>
        <div className="studio-product-meta">
          <span className="studio-price" dir="ltr">{formatPriceFromRial(product.price, true)}</span>
          {group.recommendedSize && <span>{group.recommendedSize}</span>}
        </div>
        {product.matchHighlights && product.matchHighlights.length > 0 && (
          <div className="studio-product-highlights">
            {product.matchHighlights.slice(0, 2).map((highlight) => <span key={highlight}>{highlight}</span>)}
          </div>
        )}
        <button
          type="button"
          className={`studio-product-select ${isSelected ? 'is-selected' : ''}`}
          onClick={onToggle}
          aria-pressed={isSelected}
        >
          {isSelected ? <Check size={16} /> : <ShoppingBag size={16} />}
          {isSelected
            ? t('studio.result.v2.card.removeFromBasket', 'حذف از سبد')
            : t('studio.result.v2.card.addToBasket', 'افزودن محصول به سبد')}
        </button>
      </div>
    </article>
  );
}

export function RecommendationCard({
  group,
  stepNumber,
  isWhyExpanded,
  isAccepted = false,
  basketProductIds,
  onToggleWhy,
  onProductClick,
  onToggleAccepted,
  onToggleBasketProduct,
  onUpdateQuantity,
}: RecommendationCardProps) {
  const { t } = useTranslation();
  const heroProduct = group.products[0] || null;
  const alternatives = group.products.slice(1, 4);
  const isActionItem = group.actionStatus !== 'available' || !heroProduct;
  const quantity = group.quantity || 1;
  const problem = group.recommendationReasonFa || t('studio.result.v2.card.defaultProblem', 'این بخش از فضا با ظرفیت اصلی اتاق هم‌خوان نیست.');
  const solution = group.designRationaleFa || t('studio.result.v2.card.defaultSolution', 'انتخابی هماهنگ با مقیاس، رنگ و سبک فضا.');

  return (
    <article
      id={`recommendation-${group.itemId}`}
      className="studio-recommendation-card"
      tabIndex={-1}
      style={{ fontFamily: FONT }}
    >
      <header className="studio-recommendation-header">
        <div className="studio-recommendation-step" dir="ltr">{String(stepNumber || 1).padStart(2, '0')}</div>
        <div className="studio-recommendation-title">
          <span>{t('studio.result.v2.card.changeLabel', 'تغییر پیشنهادی')}</span>
          <h3>{group.categoryDisplay}</h3>
        </div>
        <span className="studio-recommendation-impact">{impactText(group.impactLevel, t)}</span>
      </header>

      <div className="studio-recommendation-copy">
        <p><strong>{t('studio.result.v2.card.problemStatement', 'مشکل فعلی')}:</strong> {problem}</p>
        <p><strong>{t('studio.result.v2.card.designStrategy', 'راهکار پیشنهادی')}:</strong> {solution}</p>
        <p><strong>{t('studio.result.v2.card.expectedImpact', 'اثر مورد انتظار')}:</strong> {t('studio.result.v2.card.expectedImpactCopy', 'تعادل بیشتر، کاربرد بهتر و خوانایی بالاتر در فضا')}</p>
      </div>

      {!isActionItem && heroProduct && (
        <>
          {onUpdateQuantity && (
            <div className="studio-quantity-control" dir="ltr">
              <span>{t('studio.result.v2.basket.quantity', 'تعداد')}</span>
              <button type="button" onClick={() => onUpdateQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label={t('basket.decrease', 'کاهش تعداد')}><Minus size={16} /></button>
              <strong>{toLocalizedDigits(quantity)}</strong>
              <button type="button" onClick={() => onUpdateQuantity(Math.min(99, quantity + 1))} disabled={quantity >= 99} aria-label={t('basket.increase', 'افزایش تعداد')}><Plus size={16} /></button>
            </div>
          )}

          <ProductPreview
            product={heroProduct}
            group={group}
            isPrimary
            isSelected={basketProductIds.has(heroProduct.id)}
            onOpen={() => onProductClick(heroProduct)}
            onToggle={() => onToggleBasketProduct(heroProduct.id)}
          />

          {alternatives.length > 0 && (
            <div className="studio-alternatives">
              <div className="studio-alternatives-heading">
                <h4>{t('studio.result.v2.card.alternatives', 'دو جایگزین برای مقایسه')}</h4>
                <span>{t('studio.result.v2.card.alternativesHint', 'انتخاب محصول مستقل از انتخاب تغییر است')}</span>
              </div>
              <div className="studio-alternatives-grid">
                {alternatives.map((product) => (
                  <ProductPreview
                    key={product.id}
                    product={product}
                    group={group}
                    isPrimary={false}
                    isSelected={basketProductIds.has(product.id)}
                    onOpen={() => onProductClick(product)}
                    onToggle={() => onToggleBasketProduct(product.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isActionItem && (
        <div className="studio-action-item">
          {group.actionGuidance && <p>{group.actionGuidance}</p>}
          {group.placements.length > 0 && (
            <div className="studio-placement-list">
              {group.placements.map((placement) => <span key={placement}>{placement}</span>)}
            </div>
          )}
        </div>
      )}

      <div className="studio-recommendation-actions">
        <button type="button" className={`studio-primary-button studio-accept-button ${isAccepted ? 'is-selected' : ''}`} onClick={onToggleAccepted} aria-pressed={isAccepted}>
          {isAccepted ? <Check size={17} /> : null}
          {isAccepted ? t('studio.result.v2.card.accepted', 'تغییر انتخاب شد') : t('studio.result.v2.card.accept', 'انتخاب تغییر')}
        </button>
        <button type="button" className="studio-details-toggle studio-why-button" onClick={onToggleWhy} aria-expanded={isWhyExpanded}>
          <span>{t('studio.result.v2.card.whyChange', 'چرا این تغییر؟')}</span>
          <ChevronDown className={isWhyExpanded ? 'is-open' : ''} size={16} />
        </button>
      </div>

      {isWhyExpanded && (
        <div className="studio-recommendation-detail">
          <p>{group.recommendationReasonFa || problem}</p>
          {group.recommendedSize && <span>{t('studio.result.v2.card.budgetHint', 'بودجه تقریبی بر اساس انتخاب اصلی')}: {formatPriceFromRial(heroProduct?.price ? heroProduct.price * quantity : 0, true)}</span>}
        </div>
      )}
    </article>
  );
}
