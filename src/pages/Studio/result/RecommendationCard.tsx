import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import { AlertTriangle, BarChart3, Check, ChevronDown, Lightbulb, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  onUpdateQuantity,
}: {
  product: Product & { store?: string; matchScore?: number };
  group: CategoryGroup;
  isSelected: boolean;
  isPrimary: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onUpdateQuantity?: (quantity: number) => void;
}) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  const { t } = useTranslation();
  const reason = product.persianReason || group.recommendationReasonFa || t('studio.result.v2.card.defaultReason', 'با سبک کلی فضا هماهنگ است.');

  return (
    <article className={`studio-product-preview ${isPrimary ? 'is-primary' : ''}`} dir="ltr">
      <button type="button" className="studio-product-image-button" onClick={onOpen} aria-label={siteText("{{v0}}: {{v1}}", { v0: t('studio.result.v2.card.viewProduct', 'مشاهده جزئیات محصول'), v1: product.name })}>
        <AuthenticatedImage src={product.image} alt={siteValue(product.name)} className="studio-product-image" loading="lazy" />
      </button>
      <div className="studio-product-copy" dir={siteDirection()}>
        {isPrimary && <span className="studio-product-badge">{t('studio.result.v2.card.recommendedProduct', 'محصول پیشنهادی')}</span>}
        <button type="button" className="studio-product-name" onClick={onOpen}>{siteValue(product.name)}</button>
        <span className="studio-product-reason">{siteValue(reason)}</span>
        <div className="studio-product-meta">
          <span className="studio-price" dir="ltr">{product.priceUnknown ? t('redesignJourney.unpriced') : siteValue(formatPriceFromRial(product.price, true))}</span>
          {siteValue(group.recommendedSize && <span>{siteValue(group.recommendedSize)}</span>)}
        </div>
        {siteValue(isPrimary && product.matchHighlights && product.matchHighlights.length > 0 && (
          <div className="studio-product-highlights">
            {siteValue(product.matchHighlights.slice(0, 2).map((highlight) => <span key={highlight}>{siteValue(highlight)}</span>))}
          </div>
        ))}
        {isPrimary && onUpdateQuantity && <div className="studio-quantity-control" dir="ltr">
          <span>{t('studio.result.v2.basket.quantity', 'تعداد')}</span>
          <button type="button" onClick={() => onUpdateQuantity(Math.max(1, group.quantity - 1))} disabled={group.quantity <= 1} aria-label={t('basket.decrease', 'کاهش تعداد')}><Minus size={16} /></button>
          <strong>{siteValue(toLocalizedDigits(group.quantity || 1))}</strong>
          <button type="button" onClick={() => onUpdateQuantity(Math.min(99, (group.quantity || 1) + 1))} disabled={group.quantity >= 99} aria-label={t('basket.increase', 'افزایش تعداد')}><Plus size={16} /></button>
        </div>}
      </div>
        <button
          type="button"
          className={`studio-product-select ${isSelected ? 'is-selected' : ''}`}
          onClick={onToggle}
          disabled={!product.uniqueLink}
          aria-pressed={isSelected}
          dir={siteDirection()}
        >
          {isSelected ? <Check size={16} /> : <ShoppingBag size={16} />}
          {siteValue(isSelected
            ? t('studio.result.v2.card.removeFromBasket', 'حذف از سبد')
            : isPrimary ? t('studio.result.v2.card.addToBasket', 'افزودن محصول به سبد') : t('studio.result.v2.card.addToBasketShort', 'افزودن به سبد'))}
        </button>
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
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const heroProduct = group.products[0] || null;
  const alternatives = group.products.slice(1, 3);
  const isActionItem = group.actionStatus !== 'available' || !heroProduct;
  const quantity = group.quantity || 1;
  const problem = group.recommendationReasonFa || t('studio.result.v2.card.defaultProblem', 'این بخش از فضا با ظرفیت اصلی اتاق هم‌خوان نیست.');
  const solution = group.designRationaleFa || t('studio.result.v2.card.defaultSolution', 'انتخابی هماهنگ با مقیاس، رنگ و سبک فضا.');

  return (
    <div className="studio-recommendation" style={{ fontFamily: FONT }}>
    <article
      id={`recommendation-${group.itemId}`}
      className="studio-recommendation-card"
      tabIndex={-1}
    >
      <header className="studio-recommendation-header">
        <button type="button" className="studio-details-toggle studio-why-button" onClick={onToggleWhy} aria-expanded={isWhyExpanded} aria-controls={`recommendation-detail-${group.itemId}`}>
          <span>{t('studio.result.v2.card.whyChange', 'چرا این تغییر؟')}</span>
          <ChevronDown className={isWhyExpanded ? 'is-open' : ''} size={16} />
        </button>
        <div className="studio-recommendation-step" dir="ltr">{siteValue(String(stepNumber || 1).padStart(2, '0'))}</div>
        <div className="studio-recommendation-title">
          <h3>{siteValue(group.categoryDisplay)}</h3>
        </div>
        {group.impactKnown !== false && <span className="studio-recommendation-impact">{siteValue(impactText(group.impactLevel, t))}</span>}
      </header>

      <div className="studio-recommendation-copy">
        <div className="studio-recommendation-fact"><span className="studio-recommendation-fact-icon"><AlertTriangle size={18} aria-hidden="true" /></span><strong>{t('studio.result.v2.card.problemStatement', 'مشکل فعلی')}</strong><p>{siteValue(problem)}</p></div>
        <div className="studio-recommendation-fact"><span className="studio-recommendation-fact-icon"><Lightbulb size={18} aria-hidden="true" /></span><strong>{t('studio.result.v2.card.designStrategy', 'راهکار پیشنهادی')}</strong><p>{siteValue(solution)}</p></div>
        <div className="studio-recommendation-fact"><span className="studio-recommendation-fact-icon"><BarChart3 size={18} aria-hidden="true" /></span><strong>{t('studio.result.v2.card.expectedImpact', 'اثر مورد انتظار')}</strong><p>{t('studio.result.v2.card.expectedImpactCopy', 'تعادل بیشتر، کاربرد بهتر و خوانایی بالاتر در فضا')}</p></div>
      </div>

      <div id={`recommendation-detail-${group.itemId}`} hidden={!isWhyExpanded} className="studio-recommendation-detail">
        <p>{siteValue(group.recommendationReasonFa || problem)}</p>
        {group.recommendedSize && <span>{t('studio.result.v2.card.budgetHint', 'بودجه تقریبی')}: {siteValue(formatPriceFromRial(heroProduct?.price ? heroProduct.price * quantity : 0, true))}</span>}
      </div>

      {siteValue(!isActionItem && heroProduct && (
          <ProductPreview
            product={heroProduct}
            group={group}
            isPrimary
            isSelected={basketProductIds.has(heroProduct.id)}
            onOpen={() => onProductClick(heroProduct)}
            onToggle={() => onToggleBasketProduct(heroProduct.id)}
            onUpdateQuantity={onUpdateQuantity}
          />
      ))}

      {siteValue(isActionItem && (
        <div className="studio-action-item">
          {siteValue(group.actionGuidance && <p>{siteValue(group.actionGuidance)}</p>)}
          {siteValue(group.placements.length > 0 && (
            <div className="studio-placement-list">
              {siteValue(group.placements.map((placement) => <span key={placement}>{siteValue(placement)}</span>))}
            </div>
          ))}
        </div>
      ))}

      {onToggleAccepted && <div className="studio-recommendation-actions">
        <button type="button" className={`studio-primary-button studio-accept-button ${isAccepted ? 'is-selected' : ''}`} onClick={onToggleAccepted} aria-pressed={isAccepted}>
          {siteValue(isAccepted ? <Check size={17} /> : null)}
          {siteValue(isAccepted ? t('studio.result.v2.card.accepted', 'تغییر انتخاب شد') : t('studio.result.v2.card.accept', 'انتخاب تغییر'))}
        </button>
      </div>}
    </article>
    {!isActionItem && alternatives.length > 0 && <section className="studio-alternatives" aria-label={t('studio.result.v2.product.alternativesTitle', 'مقایسه جایگزین‌ها')}>
      <div className="studio-alternatives-heading">
        <h4>{alternatives.length === 2 ? t('studio.result.v2.card.alternatives', 'دو جایگزین') : toLocalizedDigits(t('studio.result.v2.card.alternativeCount', { count: alternatives.length, defaultValue: '{{count}} جایگزین دیگر' }))}</h4>
        <span>{t('studio.result.v2.card.alternativesHint', 'برای مقایسه سریع')}</span>
      </div>
      <div className="studio-alternatives-grid">
        {alternatives.map(product => <ProductPreview key={product.id} product={product} group={group} isPrimary={false}
          isSelected={basketProductIds.has(product.id)} onOpen={() => onProductClick(product)} onToggle={() => onToggleBasketProduct(product.id)} />)}
      </div>
      {group.products.length > 3 && <button type="button" className="studio-product-more" onClick={() => onProductClick(heroProduct!)}>{t('studio.result.v2.card.viewAllProducts', 'مشاهده همه')}</button>}
    </section>}
    </div>
  );
}
