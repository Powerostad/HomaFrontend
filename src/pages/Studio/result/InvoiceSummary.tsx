/**
 * InvoiceSummary — Shopping List Design Basket
 *
 * Shows all products in the basket (main + alternatives).
 * Main products are grouped by category; alternatives show individually.
 * Interactive checkboxes for toggling items.
 *
 * Uses design tokens from globals.css throughout.
 */
import React, { useMemo } from 'react';
import { ShoppingBag, Check, Minus, Plus, Star, ArrowLeft, Loader2 } from 'lucide-react';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { CategoryGroup } from './types';
import type { Product } from '../components/ProductDetailSheet';

const FONT = 'var(--font-family-vazirmatn)';
const FONT_SERIF = 'var(--font-family-serif)';

interface BasketItem {
  product: Product & { store?: string; matchScore?: number };
  group: CategoryGroup;
  isMain: boolean;
  qty: number;
  lineTotal: number;
}

interface InvoiceSummaryProps {
  categoryGroups: CategoryGroup[];
  acceptedItems: Set<number>;
  basketProductIds: Set<string>;
  selectedPrice: number;
  harmonyScore?: number;
  projectedScore?: number;
  liveProjectedScore?: number;
  onToggleAccepted?: (itemId: number) => void;
  onToggleBasketProduct?: (productId: string) => void;
  onFinalize?: () => void;
  isFinalizing?: boolean;
  onUpdateQuantity?: (itemId: number, newQuantity: number) => void;
  onUpdateProductQuantity?: (productId: string, newQuantity: number) => void;
  productQuantityOverrides?: Map<string, number>;
}

export function InvoiceSummary({
  categoryGroups,
  basketProductIds,
  onToggleBasketProduct,
  onFinalize,
  isFinalizing = false,
  onUpdateQuantity,
  onUpdateProductQuantity,
  productQuantityOverrides = new Map(),
}: InvoiceSummaryProps) {
  // Build flat list of all products in the basket
  const basketItems = useMemo<BasketItem[]>(() => {
    const items: BasketItem[] = [];
    for (const group of categoryGroups) {
      if (group.actionStatus !== 'available' || group.products.length === 0) continue;
      for (let i = 0; i < group.products.length; i++) {
        const product = group.products[i];
        if (!basketProductIds.has(product.id)) continue;
        const isMain = i === 0;
        const qty = isMain
          ? (group.quantity || 1)
          : (productQuantityOverrides.get(product.id) ?? group.quantity ?? 1);
        items.push({
          product,
          group,
          isMain,
          qty,
          lineTotal: product.price * qty,
        });
      }
    }
    return items;
  }, [categoryGroups, basketProductIds, productQuantityOverrides]);

  // Total price of basket items
  const basketTotal = useMemo(() => {
    return basketItems.reduce((acc, item) => acc + item.lineTotal, 0);
  }, [basketItems]);

  const hasItems = basketItems.length > 0;

  return (
    <section
      aria-label="لیست خرید شما"
      style={{
        fontFamily: FONT,
        marginTop: 'var(--spacing-xl)',
        marginBottom: 'var(--spacing-lg)',
      }}
    >
      {/* Divider */}
      <div
        style={{
          width: '100%',
          height: '1px',
          background: 'var(--editorial-hairline)',
          marginBottom: 'var(--spacing-lg)',
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--spacing-md)' }}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag
            size={14}
            strokeWidth={1.3}
            style={{ color: 'var(--editorial-taupe)', opacity: 0.7 }}
          />
          <h3
            style={{
              fontSize: 'var(--text-h4-size)',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: FONT,
              color: 'var(--editorial-charcoal)',
            }}
          >
            لیست خرید شما
          </h3>
        </div>
        {hasItems && (
          <span
            style={{
              fontSize: 'var(--text-caption-size)',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
            }}
          >
            {toLocalizedDigits(basketItems.length)} محصول
          </span>
        )}
      </div>

      {/* Items / Empty state */}
      {!hasItems ? (
        <div
          className="flex flex-col items-center justify-center"
          style={{
            padding: 'var(--spacing-lg) var(--spacing-md)',
            borderRadius: 'var(--radius-card)',
            border: '1px dashed var(--editorial-hairline)',
            background: 'rgba(0,0,0,0.01)',
          }}
        >
          <ShoppingBag
            size={24}
            strokeWidth={1}
            style={{
              color: 'var(--editorial-taupe)',
              opacity: 0.3,
              marginBottom: '12px',
            }}
          />
          <p
            style={{
              fontSize: 'var(--text-caption-size)',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              textAlign: 'center',
              lineHeight: 1.7,
            }}
          >
            هنوز محصولی انتخاب نکردید
          </p>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              textAlign: 'center',
              opacity: 0.6,
              marginTop: '4px',
            }}
          >
            با زدن «افزودن به لیست خرید» روی هر محصول، اینجا نمایش داده می‌شه
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col"
          style={{ gap: '0' }}
        >
          {/* ═══ Line Items ═══ */}
          {basketItems.map((item, idx) => {
            const { product, group, isMain, qty, lineTotal } = item;

            return (
              <div
                key={product.id}
                className="flex items-center justify-between"
                style={{
                  padding: '12px 0',
                  borderBottom:
                    idx < basketItems.length - 1
                      ? '1px solid var(--editorial-hairline)'
                      : 'none',
                }}
              >
                {/* Left: remove button + category + product name */}
                <div
                  className="flex items-center gap-3"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {/* Remove from basket button */}
                  <button
                    onClick={() => onToggleBasketProduct?.(product.id)}
                    className="flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200"
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: 'var(--feedback-good)',
                      border: '2px solid var(--feedback-good)',
                      padding: 0,
                    }}
                    aria-label={`حذف ${product.name} از لیست خرید`}
                    role="checkbox"
                    aria-checked={true}
                  >
                    <Check
                      size={13}
                      strokeWidth={3}
                      style={{ color: '#FFFFFF' }}
                    />
                  </button>

                  <div
                    className="flex flex-col"
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-regular)',
                          fontFamily: FONT,
                          color: 'var(--editorial-taupe)',
                        }}
                      >
                        {group.categoryDisplay}
                      </span>
                      {isMain && (
                        <div
                          className="flex items-center gap-0.5"
                          style={{
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(0,49,45,0.06)',
                            fontSize: '9px',
                            fontWeight: 'var(--font-weight-semibold)',
                            fontFamily: FONT,
                            color: 'var(--feedback-good)',
                          }}
                        >
                          <Star size={7} strokeWidth={2} fill="currentColor" />
                          پیشنهاد ما
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1" style={{ minWidth: 0 }}>
                      <span
                        className="truncate"
                        style={{
                          fontSize: 'var(--text-caption-size)',
                          fontWeight: 'var(--font-weight-regular)',
                          fontFamily: FONT,
                          color: 'var(--editorial-charcoal)',
                        }}
                      >
                        {product.name}
                      </span>
                      {qty > 1 && !(isMain ? onUpdateQuantity : onUpdateProductQuantity) && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-semibold)',
                            fontFamily: FONT,
                            color: 'var(--editorial-charcoal)',
                            flexShrink: 0,
                            opacity: 0.7,
                          }}
                        >
                          × {toLocalizedDigits(qty)}
                        </span>
                      )}
                    </div>
                    {/* Inline mini stepper for quantity-adjustable items (main + alternatives) */}
                    {(() => {
                      const canAdjust = isMain ? !!onUpdateQuantity : !!onUpdateProductQuantity;
                      if (!canAdjust || qty <= 0) return null;
                      const handleDecrease = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (isMain) onUpdateQuantity!(group.itemId, qty - 1);
                        else onUpdateProductQuantity!(product.id, qty - 1);
                      };
                      const handleIncrease = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (isMain) onUpdateQuantity!(group.itemId, qty + 1);
                        else onUpdateProductQuantity!(product.id, qty + 1);
                      };
                      return (
                        <div className="flex items-center" style={{ gap: '0', marginTop: '4px' }}>
                          <button
                            onClick={handleDecrease}
                            disabled={qty <= 1}
                            className="flex items-center justify-center cursor-pointer transition-all duration-200"
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: 'var(--radius-full)',
                              background: qty <= 1 ? 'transparent' : 'var(--card)',
                              border: qty <= 1 ? '1px solid var(--editorial-hairline)' : '1px solid var(--border)',
                              color: qty <= 1 ? 'var(--editorial-hairline)' : 'var(--editorial-charcoal)',
                              padding: 0,
                              opacity: qty <= 1 ? 0.3 : 1,
                            }}
                            aria-label="کاهش تعداد"
                          >
                            <Minus size={10} strokeWidth={2} />
                          </button>
                          <span
                            className="tabular-nums"
                            style={{
                              minWidth: '28px',
                              textAlign: 'center',
                              fontSize: 'var(--text-caption-size)',
                              fontWeight: 'var(--font-weight-semibold)',
                              fontFamily: FONT,
                              color: 'var(--editorial-charcoal)',
                              display: 'inline-block',
                            }}
                          >
                            {toLocalizedDigits(qty)}
                          </span>
                          <button
                            onClick={handleIncrease}
                            disabled={qty >= 99}
                            className="flex items-center justify-center cursor-pointer transition-all duration-200"
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--card)',
                              border: '1px solid var(--border)',
                              color: 'var(--editorial-charcoal)',
                              padding: 0,
                            }}
                            aria-label="افزایش تعداد"
                          >
                            <Plus size={10} strokeWidth={2} />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right: price */}
                <span
                  className="tabular-nums shrink-0"
                  dir="ltr"
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--editorial-charcoal)',
                    letterSpacing: '0.02em',
                    marginRight: '4px',
                  }}
                >
                  {lineTotal > 0 ? formatPriceFromRial(lineTotal, false) : '—'}
                </span>
              </div>
            );
          })}

          {/* Total */}
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: 'var(--spacing-sm)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '2px solid var(--editorial-charcoal)',
            }}
          >
            <div className="flex items-center" style={{ gap: '6px' }}>
              <span
                style={{
                  fontSize: 'var(--text-label-size)',
                  fontWeight: 'var(--font-weight-semibold)',
                  fontFamily: FONT,
                  color: 'var(--editorial-charcoal)',
                }}
              >
                جمع لیست خرید
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-regular)',
                  fontFamily: FONT,
                  color: 'var(--editorial-taupe)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--editorial-hairline)',
                }}
              >
                تخمینی
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="tabular-nums"
                dir="ltr"
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 'var(--text-h3-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--editorial-charcoal)',
                  letterSpacing: '0.02em',
                }}
              >
                {formatPriceFromRial(basketTotal, false)}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-caption-size)',
                  fontWeight: 'var(--font-weight-regular)',
                  fontFamily: FONT,
                  color: 'var(--editorial-taupe)',
                }}
              >
                تومان
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <p
        style={{
          fontSize: '11px',
          fontWeight: 'var(--font-weight-regular)',
          fontFamily: FONT,
          color: 'var(--editorial-taupe)',
          marginTop: 'var(--spacing-sm)',
          lineHeight: 1.6,
        }}
      >
        قیمت‌ها تخمینی‌اند و شامل محصولات انتخاب‌شده می‌شن. هزینه اجرا و نصب جداگانه محاسبه
        می‌شه.
      </p>

      {/* ═══ Finalize CTA — only when basket has items ═══ */}
      {hasItems && onFinalize && (
        <button
          onClick={onFinalize}
          disabled={isFinalizing}
          className="w-full flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
          style={{
            height: 'var(--btn-dark-h-mobile)',
            marginTop: 'var(--spacing-md)',
            background: 'var(--btn-dark-bg)',
            color: 'var(--btn-dark-text)',
            border: 'none',
            borderRadius: '0px',
            cursor: isFinalizing ? 'wait' : 'pointer',
            fontFamily: FONT,
            fontSize: 'var(--text-label-size)',
            fontWeight: 'var(--font-weight-semibold)',
            letterSpacing: '0.04em',
            boxShadow: 'var(--btn-dark-shadow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--btn-dark-hover)';
            e.currentTarget.style.boxShadow = 'var(--btn-dark-shadow-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--btn-dark-bg)';
            e.currentTarget.style.boxShadow = 'var(--btn-dark-shadow)';
          }}
          aria-label="ادامه به پرداخت"
        >
          {isFinalizing ? (
            <>
              <span>در حال آماده‌سازی…</span>
              <Loader2 size={16} strokeWidth={2} className="animate-spin" />
            </>
          ) : (
            <>
              <span>ادامه به پرداخت</span>
              <ArrowLeft size={16} strokeWidth={2} />
            </>
          )}
        </button>
      )}
    </section>
  );
}
