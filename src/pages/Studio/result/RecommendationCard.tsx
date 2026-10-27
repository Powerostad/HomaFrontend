import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import { AlertTriangle, ArrowLeftRight, BarChart3, Check, ChevronDown, Crown, Lightbulb, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { Product } from '../components/ProductDetailSheet';
import type { CategoryGroup, InterventionTier } from './types';
import { ProductRefinement, type RefineProduct } from './ProductRefinement';

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
  onRefineProduct?: RefineProduct;
  busy?: boolean;
  onMakePrimary?: (productId: string) => void;
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
  isKey = false,
  onSwap,
  alternativesOpen,
}: {
  product: Product & { store?: string; matchScore?: number };
  group: CategoryGroup;
  isSelected: boolean;
  isPrimary: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onUpdateQuantity?: (quantity: number) => void;
  isKey?: boolean;
  onSwap?: () => void;
  alternativesOpen?: boolean;
}) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  const { t } = useTranslation();

  return (
    <article className={`studio-product-preview ${isPrimary ? 'is-primary' : ''}`} dir={siteDirection()}>
      <button type="button" className="studio-product-image-button" onClick={onOpen} aria-label={siteText("{{v0}}: {{v1}}", { v0: t('studio.result.v2.card.viewProduct', 'مشاهده جزئیات محصول'), v1: product.name })}>
        <AuthenticatedImage src={product.image} alt={siteValue(product.name)} className="studio-product-image" loading="lazy" />
        {isKey && <span className="studio-product-key" dir={siteDirection()}><Crown size={14} aria-hidden="true" />{t('studioProductLayout.keyProduct')}</span>}
      </button>
      <div className="studio-product-copy" dir={siteDirection()}>
        <span className="studio-product-category">{siteValue(product.category || group.category)}</span>
        {isPrimary && group.changeKind && <span className="studio-product-change" data-change={group.changeKind}>{t(group.changeKind === 'added' ? 'studioProject.productAdded' : 'studioProject.productChanged', group.changeKind === 'added' ? 'اضافه‌شده' : 'تغییرکرده')}</span>}
        <button type="button" className="studio-product-name" onClick={onOpen}>{siteValue(product.name)}</button>
        <div className="studio-product-meta">
          <span className="studio-price">{product.priceUnknown ? t('redesignJourney.unpriced') : siteValue(formatPriceFromRial(product.price, true))}</span>
        </div>
        {isPrimary && isSelected && onUpdateQuantity && <div className="studio-quantity-control">
          <span>{t('studio.result.v2.basket.quantity', 'تعداد')}</span>
          <div className="studio-quantity-stepper" dir="ltr">
          <button type="button" onClick={() => onUpdateQuantity(Math.max(1, group.quantity - 1))} disabled={!!product.purchaseStatus || group.quantity <= 1} aria-label={t('basket.decrease', 'کاهش تعداد')}><Minus size={16} /></button>
          <strong>{siteValue(toLocalizedDigits(group.quantity || 1))}</strong>
          <button type="button" onClick={() => onUpdateQuantity(Math.min(99, (group.quantity || 1) + 1))} disabled={!!product.purchaseStatus || group.quantity >= 99} aria-label={t('basket.increase', 'افزایش تعداد')}><Plus size={16} /></button>
          </div>
        </div>}
      </div>
      <div className="studio-product-row-actions" dir={siteDirection()}>
        <Button variant={isSelected ? 'outline' : 'default'}
          type="button"
          className={`studio-product-select ${isSelected ? 'is-selected' : ''}`}
          onClick={onToggle}
          disabled={!product.uniqueLink || (!!product.purchaseStatus && product.purchaseStatus !== 'ready' && !isSelected)}
          aria-pressed={isSelected}
          dir={siteDirection()}
        >
          {isSelected ? <Trash2 size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
          <span className="studio-product-select-label">{siteValue(isSelected
            ? t('studio.result.v2.card.removeFromBasket', 'حذف از سبد')
            : t('studio.result.v2.card.addToBasketShort', 'افزودن به سبد'))}</span>
        </Button>
        {onSwap && <Button variant="outline" className="studio-swap-toggle" aria-expanded={alternativesOpen} aria-controls={`alternatives-${group.itemId}`} onClick={onSwap}><ArrowLeftRight size={16} aria-hidden="true" />{t('studioProductLayout.swap')}</Button>}
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
  isTopPriority,
  onMakePrimary,
  onRefineProduct,
  busy = false,
}: RecommendationCardProps) {
  const { siteValue, siteDirection } = useSiteTranslation();
  const { t } = useTranslation();
  const [alternativesOpen, setAlternativesOpen] = useState(false);
  const heroProduct = group.products[0] || null;
  const alternatives = group.products.slice(1, 11);
  const isActionItem = group.actionStatus !== 'available' || !heroProduct;
  const problem = group.recommendationReasonFa;
  const solution = group.designRationaleFa;

  return (
    <div className={`studio-recommendation${isActionItem ? '' : ' studio-product-row'}`} style={{ fontFamily: FONT }} dir={siteDirection()}>
    <article
      id={`recommendation-${group.itemId}`}
      className="studio-recommendation-card"
      tabIndex={-1}
    >
      {isActionItem && <header className="studio-recommendation-header">
        {group.changeKind && <span className="studio-product-change" data-change={group.changeKind}>{t(group.changeKind === 'added' ? 'studioProject.productAdded' : 'studioProject.productChanged', group.changeKind === 'added' ? 'اضافه‌شده' : 'تغییرکرده')}</span>}
        <button type="button" className="studio-details-toggle studio-why-button" onClick={onToggleWhy} aria-expanded={isWhyExpanded} aria-controls={`recommendation-detail-${group.itemId}`}>
          <span>{t('studio.result.v2.card.whyChange', 'چرا این تغییر؟')}</span>
          <ChevronDown className={isWhyExpanded ? 'is-open' : ''} size={16} />
        </button>
        <div className="studio-recommendation-step" dir="ltr">{siteValue(String(stepNumber || 1).padStart(2, '0'))}</div>
        <div className="studio-recommendation-title">
          <h3>{siteValue(group.categoryDisplay)}</h3>
        </div>
        {group.impactKnown !== false && <span className="studio-recommendation-impact">{siteValue(impactText(group.impactLevel, t))}</span>}
      </header>}

      {isActionItem && <div id={`recommendation-detail-${group.itemId}`} hidden={!isWhyExpanded} className="studio-recommendation-detail">
      <div className="studio-recommendation-copy">
        {problem && <div className="studio-recommendation-fact"><span className="studio-recommendation-fact-icon"><AlertTriangle size={18} aria-hidden="true" /></span><strong>{t('studio.result.v2.card.problemStatement', 'مشکل فعلی')}</strong><p>{siteValue(problem)}</p></div>}
        {solution && <div className="studio-recommendation-fact"><span className="studio-recommendation-fact-icon"><Lightbulb size={18} aria-hidden="true" /></span><strong>{t('studio.result.v2.card.designStrategy', 'راهکار پیشنهادی')}</strong><p>{siteValue(solution)}</p></div>}
        {group.impactKnown !== false && <div className="studio-recommendation-fact"><span className="studio-recommendation-fact-icon"><BarChart3 size={18} aria-hidden="true" /></span><strong>{t('studio.result.v2.card.expectedImpact', 'اثر مورد انتظار')}</strong><p>{siteValue(impactText(group.impactLevel, t))}</p></div>}
      </div>
        {group.recommendedSize && <span>{siteValue(group.recommendedSize)}</span>}
      </div>}

      {siteValue(!isActionItem && heroProduct && (
          <ProductPreview
            product={heroProduct}
            group={group}
            isPrimary
            isKey={isTopPriority}
            onSwap={alternatives.length > 0 ? () => setAlternativesOpen(value => !value) : undefined}
            alternativesOpen={alternativesOpen}
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

      {!isActionItem && <details className="studio-v9-design-decision">
        <summary>{siteValue(group.categoryDisplay)} · {t('studio.result.v2.card.whyChange', 'چرا این تغییر؟')}</summary>
        {problem && <p>{siteValue(problem)}</p>}
        {solution && solution !== problem && <p>{siteValue(solution)}</p>}
      </details>}
      {onToggleAccepted && <div className="studio-recommendation-actions">
        <button type="button" className={`studio-primary-button studio-accept-button ${isAccepted ? 'is-selected' : ''}`} onClick={onToggleAccepted} aria-pressed={isAccepted}>
          {siteValue(isAccepted ? <Check size={17} /> : null)}
          {siteValue(isAccepted ? t('studio.v9.decisionSelected', 'تغییر انتخاب شد') : t('studio.v9.acceptDecision', 'انتخاب این تغییر'))}
        </button>
      </div>}
    {!isActionItem && alternatives.length > 0 && <section id={`alternatives-${group.itemId}`} hidden={!alternativesOpen} className="studio-alternatives" aria-label={t('studio.result.v2.product.alternativesTitle', 'مقایسه جایگزین‌ها')}>
      <div className="studio-alternatives-heading">
        <h4>{alternatives.length === 2 ? t('studio.result.v2.card.alternatives', 'دو جایگزین') : toLocalizedDigits(t('studio.result.v2.card.alternativeCount', { count: alternatives.length, defaultValue: '{{count}} جایگزین دیگر' }))}</h4>
        <Button variant="ghost" size="icon" aria-label={t('common.close', 'بستن')} onClick={() => setAlternativesOpen(false)}><X size={16} aria-hidden="true" /></Button>
      </div>
      <div className="studio-alternatives-grid" id={`alternative-options-${group.itemId}`}>
        {alternatives.map((product, index) => <button type="button" className="studio-swap-option" key={product.id} data-recommended={index < 3 || undefined}
          aria-label={`${t('studioProductLayout.makePrimary')}: ${siteValue(product.name)}`}
          onClick={() => { onMakePrimary?.(product.id); setAlternativesOpen(false); }} disabled={!onMakePrimary || busy}>
          <span className="studio-swap-image"><AuthenticatedImage src={product.image} alt="" loading="lazy" /></span>
          <span className="studio-swap-label">{index < 3 && <span className="studio-swap-tag">{t('studioProductLayout.suggestionNumber', 'پیشنهاد')} {siteValue(toLocalizedDigits(index + 1))}</span>}</span>
          <strong>{product.priceUnknown ? t('redesignJourney.unpriced') : siteValue(formatPriceFromRial(product.price, true))}</strong>
          <span className="studio-swap-name" title={siteValue(product.name)}>{siteValue(product.name)}</span>
        </button>)}
      </div>
    </section>}
    {!isActionItem && heroProduct && onRefineProduct && <ProductRefinement key={heroProduct.id} product={heroProduct} busy={busy} onSubmit={onRefineProduct} />}
    </article>
    </div>
  );
}
