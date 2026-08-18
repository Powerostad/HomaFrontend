import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Check, ExternalLink, LayoutGrid, Loader2, Share2, ShoppingBag, Sparkles, Truck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { AddToBasketButton } from '@/components/basket/AddToBasketButton';
import { BuyButton } from '@/components/BuyButton';
import { formatPriceFromRial } from '@/utils/formatters';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  store?: string;
  style?: string;
  hotspot?: { x: number; y: number };
  persianReason?: string;
  matchHighlights?: string[];
  description?: string;
  extraDetails?: Record<string, unknown>;
  link?: string;
  uniqueLink?: string;
  availableSizes?: string[];
  availableSizesDisplay?: string[];
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: Array<{
    code: string;
    display: string;
    price: number | null;
    hasSpecificPrice: boolean;
  }>;
  priceRange?: { min: number; max: number } | null;
  matchScore?: number;
  isPromoted?: boolean;
}

interface ProductAlternative extends Product {
  label?: string;
}

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (originalId: string, newProduct: Product) => void;
  alternatives?: Product[];
  redesignSessionId?: string;
  /** Local Studio selection seam. When provided, no server basket mutation occurs here. */
  onToggleBasket?: () => void;
  isInBasket?: boolean;
  onSelectProduct?: (product: Product) => void;
}

const TABS = [
  { id: 'details', label: 'مشخصات' },
  { id: 'why', label: 'چرا این محصول؟' },
  { id: 'alternatives', label: 'جایگزین‌ها' },
] as const;

export function ProductDetailSheet({
  product,
  isOpen,
  onClose,
  onReplace,
  alternatives: propAlternatives = [],
  redesignSessionId,
  onToggleBasket,
  isInBasket = false,
  onSelectProduct,
}: ProductDetailSheetProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('details');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const alternatives = useMemo<ProductAlternative[]>(
    () => propAlternatives.map((alternative, index) => ({
      ...alternative,
      label: index === 0 ? 'نزدیک‌ترین انتخاب' : index === 1 ? 'اقتصادی‌تر' : 'پیشنهاد دیگر',
    })),
    [propAlternatives],
  );

  useEffect(() => {
    if (!isOpen || !product) return;
    setActiveTab('details');
    setSelectedSize(null);
    setIsFavorite(false);
    setIsImageLoading(true);
  }, [isOpen, product]);

  const displayPrice = selectedSize && product?.sizePrices?.[selectedSize] != null
    ? product.sizePrices[selectedSize]
    : product?.price || 0;

  if (!product) return null;

  const scrollToSection = (tabId: (typeof TABS)[number]['id']) => {
    setActiveTab(tabId);
    sectionRefs.current[tabId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('common.copied', 'لینک کپی شد'));
      }
    } catch {
      // Sharing can be cancelled by the user.
    }
  };

  const handleAlternative = async (alternative: ProductAlternative) => {
    if (onSelectProduct) {
      onSelectProduct(alternative);
      return;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 450));
    onReplace(product.id, { ...alternative, hotspot: product.hotspot });
    toast.success(t('studio.result.v2.product.replaced', 'محصول جایگزین شد'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="studio-product-sheet-content"
        aria-describedby="studio-product-sheet-description"
      >
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription id="studio-product-sheet-description" className="sr-only">
          {t('studio.result.v2.product.sheetDescription', 'مشخصات، دلیل پیشنهاد و جایگزین‌های محصول')}
        </DialogDescription>

        <button type="button" className="studio-product-sheet-close" onClick={onClose} aria-label={t('common.close', 'بستن')}>
          <X size={20} />
        </button>

        <div className="studio-product-sheet-header">
          <span>{t('studio.result.v2.product.detailsLabel', 'جزئیات محصول')}</span>
          <h2>{product.name}</h2>
          <p>{product.category}{product.store ? ` · ${product.store}` : ''}</p>
        </div>

        <div className="studio-product-sheet-tabs" role="tablist" aria-label={t('studio.result.v2.product.tabs', 'بخش‌های محصول')}>
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              tabIndex={0}
              onClick={() => scrollToSection(tab.id)}
              className={activeTab === tab.id ? 'is-active' : ''}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="studio-product-sheet-scroll">
          <section ref={(node) => { sectionRefs.current.details = node; }} className="studio-product-sheet-section" role="tabpanel" aria-label="مشخصات">
            <div className="studio-product-sheet-image-wrap">
              {isImageLoading && (
                <div className="studio-product-sheet-image-loading" role="status">
                  <Loader2 size={24} className="animate-spin" />
                  <span>{t('studio.result.v2.product.loadingImage', 'در حال بارگذاری تصویر محصول...')}</span>
                </div>
              )}
              <AuthenticatedImage
                src={product.image}
                alt={product.name}
                className="studio-product-sheet-image"
                onLoad={() => setIsImageLoading(false)}
                onError={() => setIsImageLoading(false)}
              />
            </div>

            <div className="studio-product-sheet-price-row">
              <div>
                <span>{t('product.price', 'قیمت')}</span>
                <strong dir="ltr">{formatPriceFromRial(displayPrice, false)}</strong>
                <small>{t('common.toman', 'تومان')}</small>
              </div>
              <div className="studio-product-sheet-actions">
                <button type="button" onClick={() => setIsFavorite(!isFavorite)} aria-label={isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'} aria-pressed={isFavorite}>
                  <Bookmark size={19} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button type="button" onClick={handleShare} aria-label={t('common.share', 'اشتراک‌گذاری')}><Share2 size={19} /></button>
              </div>
            </div>

            {(product.sizePricesDisplay?.length || product.availableSizesDisplay?.length) ? (
              <div className="studio-product-sheet-sizes">
                <strong>{t('product.selectSize', 'انتخاب سایز')}</strong>
                <div>
                  {(product.sizePricesDisplay || product.availableSizesDisplay?.map((display) => ({ code: display, display, price: null, hasSpecificPrice: false })) || []).map((size) => (
                    <button
                      type="button"
                      key={size.code}
                      className={selectedSize === size.code ? 'is-selected' : ''}
                      onClick={() => setSelectedSize(selectedSize === size.code ? null : size.code)}
                      aria-pressed={selectedSize === size.code}
                    >
                      {size.display}
                      {size.hasSpecificPrice && size.price != null && <small dir="ltr">{formatPriceFromRial(size.price, false)}</small>}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="studio-product-sheet-specs">
              {product.description && <p>{product.description}</p>}
              {product.extraDetails && Object.entries(product.extraDetails).slice(0, 4).map(([key, value]) => (
                <div key={key}><span>{key}</span><strong>{String(value)}</strong></div>
              ))}
              {product.uniqueLink && <div><span>{t('studio.result.v2.product.productCode', 'شناسه کالا')}</span><strong dir="ltr">{product.uniqueLink}</strong></div>}
            </div>
          </section>

          <section ref={(node) => { sectionRefs.current.why = node; }} className="studio-product-sheet-section studio-product-sheet-why" role="tabpanel" aria-label="چرا این محصول؟">
            <div className="studio-product-sheet-section-title"><Sparkles size={18} /><h3>{t('studio.result.v2.product.whyTitle', 'چرا این محصول پیشنهاد شده؟')}</h3></div>
            <p>{product.persianReason || t('studio.result.v2.product.defaultReason', 'این محصول با توجه به سبک، رنگ و تناسب فضای شما انتخاب شده است.')}</p>
            {product.matchHighlights && product.matchHighlights.length > 0 && (
              <div className="studio-product-sheet-highlights">
                {product.matchHighlights.map((highlight) => <span key={highlight}><Check size={14} />{highlight}</span>)}
              </div>
            )}
          </section>

          <section ref={(node) => { sectionRefs.current.alternatives = node; }} className="studio-product-sheet-section" role="tabpanel" aria-label="جایگزین‌ها">
            <div className="studio-product-sheet-section-title"><LayoutGrid size={18} /><h3>{t('studio.result.v2.product.alternativesTitle', 'مقایسه جایگزین‌ها')}</h3></div>
            {alternatives.length === 0 ? (
              <p className="studio-product-sheet-empty">{t('studio.result.v2.product.noAlternatives', 'جایگزین مشابهی برای این محصول پیدا نشد.')}</p>
            ) : (
              <div className="studio-product-sheet-alternatives">
                {alternatives.map((alternative) => (
                  <article key={alternative.id}>
                    <button type="button" onClick={() => handleAlternative(alternative)} aria-label={`${t('studio.result.v2.product.selectAlternative', 'انتخاب جایگزین')}: ${alternative.name}`}>
                      <AuthenticatedImage src={alternative.image} alt={alternative.name} className="studio-product-alternative-image" />
                      <strong>{alternative.name}</strong>
                      <span>{alternative.label}</span>
                      <small dir="ltr">{formatPriceFromRial(alternative.price, true)}</small>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="studio-product-sheet-service-note"><Truck size={17} /><span>{t('studio.result.v2.product.serviceNote', 'قیمت و شرایط ارسال ممکن است در سایت فروشنده تغییر کند.')}</span></div>
        </div>

        <div className="studio-product-sheet-footer">
          {onToggleBasket ? (
            <button type="button" className={`studio-primary-button ${isInBasket ? 'is-selected' : ''}`} onClick={onToggleBasket} disabled={!product.uniqueLink} aria-pressed={isInBasket}>
              {isInBasket ? <Check size={18} /> : <ShoppingBag size={18} />}
              {isInBasket ? t('studio.result.v2.card.removeFromBasket', 'حذف از سبد') : t('studio.result.v2.card.addToBasket', 'افزودن محصول به سبد')}
            </button>
          ) : (
            <>
              {product.uniqueLink && <AddToBasketButton productUniqueLink={product.uniqueLink} sourceContext="studio" redesign_session_id={redesignSessionId} className="studio-product-sheet-basket-button" />}
              {product.uniqueLink && <BuyButton productId={product.uniqueLink} sourceContext="studio" redesignSessionId={redesignSessionId} shopName={product.store} className="studio-product-sheet-buy-button" />}
            </>
          )}
          {!product.uniqueLink && <span className="studio-product-sheet-unavailable">{t('studio.result.v2.product.purchaseUnavailable', 'اطلاعات خرید این محصول در دسترس نیست')}</span>}
          {product.link && !product.uniqueLink && <a href={product.link} target="_blank" rel="noopener noreferrer" className="studio-primary-button"><ExternalLink size={17} />{t('product.viewInStore', 'مشاهده در فروشگاه')}</a>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
