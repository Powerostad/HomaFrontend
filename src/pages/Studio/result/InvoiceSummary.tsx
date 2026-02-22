/**
 * InvoiceSummary - Basket view listing accepted products grouped by category
 *
 * Each line: product image thumbnail, name, quantity controls, line total.
 * Category subtotals and grand total at bottom.
 * "Finalize" button calls onFinalize.
 * All prices via formatPriceFromRial().
 *
 * i18n keys from studio.result.v2.basket.*
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Check, Minus, Plus, Star, ArrowLeft } from 'lucide-react';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import type { CategoryGroup } from './types';
import type { Product } from '../components/ProductDetailSheet';

interface BasketItem {
  product: Product & { store?: string; matchScore?: number };
  group: CategoryGroup;
  isMain: boolean;
  qty: number;
  lineTotal: number;
}

interface CategorySubtotal {
  category: string;
  categoryDisplay: string;
  items: BasketItem[];
  subtotal: number;
}

interface InvoiceSummaryProps {
  categoryGroups: CategoryGroup[];
  acceptedItems: Set<number>;
  basketProductIds: Set<string>;
  selectedPrice: number;
  onToggleBasketProduct: (productId: string) => void;
  onFinalize: () => void;
  onUpdateQuantity: (itemId: number, newQuantity: number) => void;
  onUpdateProductQuantity: (productId: string, newQuantity: number) => void;
  productQuantityOverrides: Map<string, number>;
}

export function InvoiceSummary({
  categoryGroups,
  acceptedItems,
  basketProductIds,
  onToggleBasketProduct,
  onFinalize,
  onUpdateQuantity,
  onUpdateProductQuantity,
  productQuantityOverrides,
}: InvoiceSummaryProps) {
  const { t } = useTranslation();

  // Build flat list of basket items grouped by category
  const categorySubtotals = useMemo<CategorySubtotal[]>(() => {
    const groupMap = new Map<string, CategorySubtotal>();

    for (const group of categoryGroups) {
      if (group.actionStatus !== 'available' || group.products.length === 0) continue;
      if (!acceptedItems.has(group.itemId)) continue;

      for (let i = 0; i < group.products.length; i++) {
        const product = group.products[i];
        if (!basketProductIds.has(product.id)) continue;

        const isMain = i === 0;
        const qty = isMain
          ? (group.quantity || 1)
          : (productQuantityOverrides.get(product.id) ?? 1);
        const lineTotal = (product.price || 0) * qty;

        const item: BasketItem = { product, group, isMain, qty, lineTotal };

        const key = group.category;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            category: group.category,
            categoryDisplay: group.categoryDisplay,
            items: [],
            subtotal: 0,
          });
        }
        const entry = groupMap.get(key)!;
        entry.items.push(item);
        entry.subtotal += lineTotal;
      }
    }

    return Array.from(groupMap.values());
  }, [categoryGroups, acceptedItems, basketProductIds, productQuantityOverrides]);

  const grandTotal = useMemo(
    () => categorySubtotals.reduce((acc, cat) => acc + cat.subtotal, 0),
    [categorySubtotals],
  );

  const totalItemCount = useMemo(
    () => categorySubtotals.reduce((acc, cat) => acc + cat.items.length, 0),
    [categorySubtotals],
  );

  const hasItems = totalItemCount > 0;

  return (
    <section aria-label={t('studio.result.v2.basket.title', 'لیست خرید شما')} className="mt-8 mb-6">
      {/* Divider */}
      <div className="w-full h-px bg-border-subtle mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={14} strokeWidth={1.3} className="text-content-muted opacity-70" />
          <h3 className="text-lg font-semibold text-content-primary">
            {t('studio.result.v2.basket.title', 'لیست خرید شما')}
          </h3>
        </div>
        {hasItems && (
          <span className="text-xs text-content-muted">
            {toLocalizedDigits(totalItemCount)} {t('studio.result.v2.basket.productCount', 'محصول')}
          </span>
        )}
      </div>

      {/* Empty state */}
      {!hasItems ? (
        <div
          className="flex flex-col items-center justify-center py-8 px-4 rounded-xl"
          style={{
            border: '1px dashed var(--border-subtle)',
            background: 'rgba(0,0,0,0.01)',
          }}
        >
          <ShoppingBag size={24} strokeWidth={1} className="text-content-muted opacity-30 mb-3" />
          <p className="text-xs text-content-muted text-center leading-7">
            {t('studio.result.v2.basket.empty', 'هنوز محصولی انتخاب نکردید')}
          </p>
          <p className="text-[11px] text-content-muted text-center opacity-60 mt-1">
            {t('studio.result.v2.basket.emptyHint', 'با زدن «افزودن به لیست خرید» روی هر محصول، اینجا نمایش داده می‌شه')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Category groups */}
          {categorySubtotals.map((catGroup) => (
            <div key={catGroup.category}>
              {/* Category header */}
              <div className="flex items-center justify-between py-2 mb-1">
                <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                  {catGroup.categoryDisplay}
                </span>
                {categorySubtotals.length > 1 && (
                  <span className="text-[11px] tabular-nums text-content-muted" dir="ltr">
                    {formatPriceFromRial(catGroup.subtotal, false)}
                  </span>
                )}
              </div>

              {/* Items */}
              {catGroup.items.map((item, idx) => {
                const { product, group, isMain, qty, lineTotal } = item;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                    style={{
                      padding: '12px 0',
                      borderBottom: idx < catGroup.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    {/* Left: checkbox + thumbnail + info */}
                    <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                      {/* Toggle button */}
                      <button
                        onClick={() => onToggleBasketProduct(product.id)}
                        className="flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200"
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          background: 'var(--color-feedback-good, #00312D)',
                          border: '2px solid var(--color-feedback-good, #00312D)',
                          padding: 0,
                        }}
                        aria-label={t('studio.result.v2.basket.removeItem', 'حذف {{name}} از لیست خرید', { name: product.name })}
                        role="checkbox"
                        aria-checked={true}
                      >
                        <Check size={13} strokeWidth={3} color="#FFFFFF" />
                      </button>

                      {/* Thumbnail */}
                      <div
                        className="shrink-0 overflow-hidden rounded-lg"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Name + meta */}
                      <div className="flex flex-col" style={{ minWidth: 0, flex: 1 }}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-content-muted">
                            {group.categoryDisplay}
                          </span>
                          {isMain && (
                            <span
                              className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 rounded-full"
                              style={{
                                background: 'rgba(0,49,45,0.06)',
                                color: 'var(--color-feedback-good, #00312D)',
                              }}
                            >
                              <Star size={7} strokeWidth={2} fill="currentColor" />
                              {t('studio.result.v2.basket.topPick', 'پیشنهاد ما')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-content-primary truncate">
                          {product.name}
                        </span>

                        {/* Quantity stepper */}
                        <div className="flex items-center mt-1" style={{ gap: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMain) onUpdateQuantity(group.itemId, qty - 1);
                              else onUpdateProductQuantity(product.id, qty - 1);
                            }}
                            disabled={qty <= 1}
                            className="flex items-center justify-center cursor-pointer transition-all duration-200"
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: 'var(--radius-full)',
                              background: qty <= 1 ? 'transparent' : 'var(--surface-elevated)',
                              border: qty <= 1 ? '1px solid var(--border-subtle)' : '1px solid var(--border-default)',
                              color: qty <= 1 ? 'var(--content-muted)' : 'var(--content-primary)',
                              padding: 0,
                              opacity: qty <= 1 ? 0.3 : 1,
                            }}
                            aria-label={t('studio.result.v2.basket.decrease', 'کاهش تعداد')}
                          >
                            <Minus size={10} strokeWidth={2} />
                          </button>
                          <span
                            className="tabular-nums text-xs font-semibold text-content-primary text-center inline-block"
                            style={{ minWidth: '28px' }}
                          >
                            {toLocalizedDigits(qty)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMain) onUpdateQuantity(group.itemId, qty + 1);
                              else onUpdateProductQuantity(product.id, qty + 1);
                            }}
                            disabled={qty >= 99}
                            className="flex items-center justify-center cursor-pointer transition-all duration-200"
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--surface-elevated)',
                              border: '1px solid var(--border-default)',
                              color: 'var(--content-primary)',
                              padding: 0,
                            }}
                            aria-label={t('studio.result.v2.basket.increase', 'افزایش تعداد')}
                          >
                            <Plus size={10} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: line total */}
                    <span
                      className="tabular-nums shrink-0 text-xs text-content-primary"
                      dir="ltr"
                      style={{ letterSpacing: '0.02em', marginRight: '4px' }}
                    >
                      {lineTotal > 0 ? formatPriceFromRial(lineTotal, false) : '\u2014'}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Grand total */}
          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: '2px solid var(--content-primary)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-content-primary">
                {t('studio.result.v2.basket.grandTotal', 'جمع لیست خرید')}
              </span>
              <span
                className="text-[10px] text-content-muted px-1.5 rounded-full"
                style={{ border: '1px solid var(--border-subtle)' }}
              >
                {t('studio.result.v2.basket.estimated', 'تخمینی')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="tabular-nums text-xl text-content-primary" dir="ltr" style={{ letterSpacing: '0.02em' }}>
                {formatPriceFromRial(grandTotal, false)}
              </span>
              <span className="text-xs text-content-muted">
                {t('common.toman', 'تومان')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <p className="text-[11px] text-content-muted mt-3 leading-relaxed">
        {t('studio.result.v2.basket.note', 'قیمت\u200Cها تخمینی\u200Cاند و شامل محصولات انتخاب\u200Cشده می\u200Cشن. هزینه اجرا و نصب جداگانه محاسبه می\u200Cشه.')}
      </p>

      {/* Finalize CTA */}
      {hasItems && (
        <button
          onClick={onFinalize}
          className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-[0.98] mt-4"
          style={{
            height: 'var(--btn-dark-h-mobile, 48px)',
            background: 'var(--content-primary)',
            color: 'var(--surface-page)',
            border: 'none',
            borderRadius: '0px',
            fontSize: 'var(--text-label-size, 14px)',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
          aria-label={t('studio.result.v2.basket.finalize', 'ادامه به پرداخت')}
        >
          <span>{t('studio.result.v2.basket.finalize', 'ادامه به پرداخت')}</span>
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
      )}
    </section>
  );
}
