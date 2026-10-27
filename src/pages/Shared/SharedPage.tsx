import { trackSharedPageViewed } from '@/analytics/events';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { ProductDetailSheet, type Product } from '@/pages/Studio/components/ProductDetailSheet';
import { fetchSharedItem } from '@/services/sharedService';
import type {
  SharedItem,
  SharedStudioCategoryItem,
  SharedStudioItem,
  SharedStudioProduct,
  SharedTryOnItem,
} from '@/types/shared';
import { formatPriceFromRial, formatRelativeTime } from '@/utils/formatters';
import { ChevronDown, ChevronUp, Maximize2, ShoppingBag, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

// =============================================================================
// Loading Skeleton
// =============================================================================

function SharedSkeleton() {
  return (
    <div className="min-h-screen w-full bg-background animate-pulse">
      <div className="w-full aspect-[4/3] bg-secondary" />
      <div className="p-6 flex flex-col gap-4">
        <div className="h-6 w-48 bg-secondary rounded" />
        <div className="h-4 w-32 bg-secondary rounded" />
        <div className="h-12 w-full bg-secondary rounded-xl" />
      </div>
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

function SharedErrorState() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
        <X size={48} strokeWidth={1} />
      </div>
      <div className="flex flex-col gap-2 text-center max-w-[280px]">
        <h3 className="text-[18px] font-bold text-foreground">
          {t('shared.invalidLink')}
        </h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          {t('shared.invalidLinkDescription')}
        </p>
      </div>
      <Link to="/">
        <Button className="rounded-full">
          {t('shared.goHome')}
        </Button>
      </Link>
    </div>
  );
}

// =============================================================================
// Studio Product Helpers
// =============================================================================

function sharedProductToUIProduct(product: SharedStudioProduct): Product & { store?: string; matchScore?: number } {
  return {
    id: String(product.id),
    name: product.name,
    price: product.price,
    category: product.category_display || product.category || '',
    store: product.shop_name || '',
    image: product.image_url,
    hotspot: { x: 50, y: 50 },
    persianReason: product.persian_reason,
    matchHighlights: product.match_highlights,
    description: product.description,
    extraDetails: product.extra_details,
    link: product.link,
    uniqueLink: product.unique_link,
    availableSizes: product.available_sizes,
    availableSizesDisplay: product.available_sizes_display,
    sizePrices: product.size_prices,
    sizePricesDisplay: product.size_prices_display?.map((sp) => ({
      code: sp.code,
      display: sp.display,
      price: sp.price,
      hasSpecificPrice: sp.has_specific_price,
    })),
    priceRange: product.price_range,
    matchScore: product.match_score,
  };
}

// =============================================================================
// Try-On Shared View
// =============================================================================

function TryOnSharedView({ item }: { item: SharedTryOnItem }) {
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <>
      <div className="min-h-screen w-full bg-background flex flex-col">
        {/* Result Image */}
        <div className="relative w-full aspect-[4/3] bg-secondary overflow-hidden group">
          <img
            src={item.result_image_url}
            alt="Result"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 h-10 bg-black/40 backdrop-blur-xl rounded-full text-white text-[12px] font-bold border border-white/20"
          >
            <Maximize2 size={14} />
            {t('gallery.detail.fullView')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Shared by label */}
          {siteValue(item.owner_name && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">
                {t('shared.sharedBy')} {siteValue(item.owner_name)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                · {siteValue(formatRelativeTime(item.created_at))}
              </span>
            </div>
          ))}

          {/* Product Info Card */}
          {siteValue(item.product_name && (
            <div className="flex gap-4 items-center p-4 bg-card rounded-2xl border border-border">
              {siteValue(item.product_image_url && (
                <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 border border-border bg-secondary/30">
                  <img
                    src={item.product_image_url}
                    alt={siteValue(item.product_name)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              <div className="flex-1 flex flex-col gap-1">
                <h2 className="text-[16px] font-bold text-foreground leading-tight">
                  {siteValue(item.product_name)}
                </h2>
                <span className="text-[12px] text-muted-foreground">
                  {siteValue(item.product_category)}
                </span>
                {siteValue(item.product_price != null && (
                  <span className="text-[14px] font-bold text-foreground">
                    {siteValue(formatPriceFromRial(item.product_price))}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* CTA */}
          {siteValue(item.product_id && (
            <Link
              to={`/try-on/${item.product_id}/upload`}
              className="w-full"
            >
              <Button className="w-full h-12 rounded-full text-[14px] font-bold">
                <ShoppingBag size={18} className="ml-2" />
                {t('shared.tryItYourself')}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Fullscreen overlay */}
      {siteValue(isFullScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"
          >
            <X size={24} />
          </button>
          <img
            src={item.result_image_url}
            alt="Result"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
          />
        </motion.div>
      ))}
    </>
  );
}

// =============================================================================
// Studio Category Card
// =============================================================================

function CategoryCard({
  categoryItem,
  onProductClick,
}: {
  categoryItem: SharedStudioCategoryItem;
  onProductClick: (product: Product & { store?: string; matchScore?: number }) => void;
}) {
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const products = categoryItem.products.map(sharedProductToUIProduct);
  const topPick = products[0];
  const alternatives = products.slice(1);

  if (!topPick) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Category header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-foreground">
          {siteValue(categoryItem.category_display || categoryItem.category)}
        </h3>
        {siteValue(alternatives.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {siteValue(alternatives.length + 1)} {t('shared.products')}
          </span>
        ))}
      </div>

      {/* AI reasoning */}
      {siteValue(categoryItem.fit_reasoning_fa && (
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {siteValue(categoryItem.fit_reasoning_fa)}
        </p>
      ))}

      {/* Top pick - large card */}
      <button
        onClick={() => onProductClick(topPick)}
        className="w-full flex gap-4 p-3 bg-card rounded-2xl border border-border text-right hover:border-foreground/20 transition-colors"
      >
        <div className="w-[80px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 bg-secondary/30">
          <img
            src={topPick.image}
            alt={siteValue(topPick.name)}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
            {t('studio.result.topPick')}
          </span>
          <span className="text-[14px] font-bold text-foreground leading-tight line-clamp-1">
            {siteValue(topPick.name)}
          </span>
          {siteValue(topPick.store && (
            <span className="text-[11px] text-muted-foreground">{siteValue(topPick.store)}</span>
          ))}
          <span className="text-[13px] font-bold text-foreground">
            {siteValue(formatPriceFromRial(topPick.price))}
          </span>
        </div>
      </button>

      {/* Alternatives toggle */}
      {siteValue(alternatives.length > 0 && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center gap-1 py-2 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {siteValue(isExpanded ? t('shared.hideAlternatives') : t('shared.showAlternatives'))}
            {siteValue(isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
          </button>

          {siteValue(isExpanded && (
            <div className="flex flex-col gap-2">
              {siteValue(alternatives.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onProductClick(product)}
                  className="w-full flex gap-3 p-2.5 bg-card rounded-xl border border-border text-right hover:border-foreground/20 transition-colors"
                >
                  <div className="w-[52px] h-[52px] rounded-lg overflow-hidden flex-shrink-0 bg-secondary/30">
                    <img
                      src={product.image}
                      alt={siteValue(product.name)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5 justify-center">
                    <span className="text-[13px] font-bold text-foreground line-clamp-1">
                      {siteValue(product.name)}
                    </span>
                    <span className="text-[12px] font-bold text-muted-foreground">
                      {siteValue(formatPriceFromRial(product.price))}
                    </span>
                  </div>
                </button>
              )))}
            </div>
          ))}
        </>
      ))}
    </div>
  );
}

// =============================================================================
// Studio Shared View
// =============================================================================

function StudioSharedView({ item }: { item: SharedStudioItem }) {
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<(Product & { store?: string; matchScore?: number }) | null>(null);

  return (
    <>
      <div className="min-h-screen w-full bg-background flex flex-col">
        {/* Result Image */}
        <div className="relative w-full aspect-[4/3] bg-secondary overflow-hidden">
          <img
            src={item.result_image_url}
            alt="Redesigned Room"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 h-10 bg-black/40 backdrop-blur-xl rounded-full text-white text-[12px] font-bold border border-white/20"
          >
            <Maximize2 size={14} />
            {t('gallery.detail.fullView')}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {/* Shared by label */}
          <div className="flex items-center gap-2">
            {siteValue(item.owner_name && (
              <span className="text-[12px] text-muted-foreground">
                {t('shared.sharedBy')} {siteValue(item.owner_name)}
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground">
              · {siteValue(formatRelativeTime(item.created_at))}
            </span>
          </div>

          {/* Room type */}
          {siteValue(item.room_type && (
            <div className="px-3 py-1.5 bg-secondary rounded-full w-fit">
              <span className="text-[12px] font-bold text-muted-foreground">
                {siteValue(item.room_type)}
              </span>
            </div>
          ))}

          {/* Category groups with products */}
          <div className="flex flex-col gap-8">
            {siteValue(item.items.map((categoryItem, index) => (
              <CategoryCard
                key={`${categoryItem.category}-${index}`}
                categoryItem={categoryItem}
                onProductClick={setSelectedProduct}
              />
            )))}
          </div>

          {/* CTA */}
          <Link to="/studio" className="w-full mt-2">
            <Button className="w-full h-12 rounded-full text-[14px] font-bold">
              {t('shared.designYourSpace')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {siteValue(isFullScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"
          >
            <X size={24} />
          </button>
          <img
            src={item.result_image_url}
            alt="Redesigned Room"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
          />
        </motion.div>
      ))}

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onReplace={() => {}}
      />
    </>
  );
}

// =============================================================================
// Main SharedPage Component
// =============================================================================

export default function SharedPage() {
  const { token } = useParams<{ token: string }>();

  const [item, setItem] = useState<SharedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadItem = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(false);

    try {
      const result = await fetchSharedItem(token);
      if (result.success && result.data) {
        setItem(result.data);
        trackSharedPageViewed({ type: result.data.type, token });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  if (isLoading) return <SharedSkeleton />;
  if (error || !item) return <SharedErrorState />;

  if (item.type === 'tryon') {
    return <TryOnSharedView item={item} />;
  }

  return <StudioSharedView item={item} />;
}
