import { ArrowLeft, Check, Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { Product } from '../components/ProductDetailSheet';
import type { CategoryGroup } from './types';

const FONT = 'var(--font-family-vazirmatn)';

interface BasketItem {
  product: Product & { store?: string; matchScore?: number };
  group: CategoryGroup;
  isMain: boolean;
  quantity: number;
  lineTotal: number;
}

interface InvoiceSummaryProps {
  categoryGroups: CategoryGroup[];
  acceptedItems: Set<number>;
  basketProductIds: Set<string>;
  selectedPrice: number;
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
  selectedPrice,
  onToggleBasketProduct,
  onFinalize,
  isFinalizing = false,
  onUpdateQuantity,
  onUpdateProductQuantity,
  productQuantityOverrides = new Map(),
}: InvoiceSummaryProps) {
  const { t } = useTranslation();
  const basketItems = useMemo<BasketItem[]>(() => {
    const items: BasketItem[] = [];
    for (const group of categoryGroups) {
      if (group.actionStatus !== 'available') continue;
      group.products.forEach((product, index) => {
        if (!basketProductIds.has(product.id)) return;
        const isMain = index === 0;
        const quantity = isMain
          ? group.quantity || 1
          : productQuantityOverrides.get(product.id) ?? group.quantity ?? 1;
        items.push({ product, group, isMain, quantity, lineTotal: product.price * quantity });
      });
    }
    return items;
  }, [basketProductIds, categoryGroups, productQuantityOverrides]);

  return (
    <section className="studio-invoice" aria-label={t('studio.result.v2.basket.title', 'سبد انتخاب‌های شما')} style={{ fontFamily: FONT }}>
      <div className="studio-invoice-heading">
        <div>
          <p className="studio-result-eyebrow">{t('studio.result.v2.phase.basket', 'سبد خرید')}</p>
          <h2>{t('studio.result.v2.basket.title', 'انتخاب‌های شما')}</h2>
          <p>{t('studio.result.v2.basket.description', 'محصولات انتخاب‌شده را بررسی کنید؛ فقط در مرحله نهایی به سبد اصلی منتقل می‌شوند.')}</p>
        </div>
        <ShoppingBag size={24} aria-hidden="true" />
      </div>

      {basketItems.length === 0 ? (
        <div className="studio-invoice-empty">
          <ShoppingBag size={32} />
          <strong>{t('studio.result.v2.basket.empty', 'هنوز محصولی به سبد انتخابی اضافه نشده است')}</strong>
          <span>{t('studio.result.v2.basket.emptyHint', 'از کارت‌های پیشنهاد، محصول مورد نظر خود را جداگانه انتخاب کنید.')}</span>
        </div>
      ) : (
        <div className="studio-invoice-list">
          {basketItems.map((item) => (
            <article key={item.product.id} className="studio-invoice-item">
              <ImageWithFallback src={item.product.image} alt={item.product.name} className="studio-invoice-image" />
              <div className="studio-invoice-item-copy">
                <span className="studio-invoice-category">{item.group.categoryDisplay}</span>
                <strong>{item.product.name}</strong>
                <div className="studio-invoice-item-meta">
                  <span>{item.isMain ? t('studio.result.v2.basket.recommended', 'پیشنهاد اصلی') : t('studio.result.v2.basket.alternative', 'جایگزین')}</span>
                  {item.group.recommendedSize && <span>{item.group.recommendedSize}</span>}
                </div>
                <div className="studio-invoice-quantity" dir="ltr">
                  <span>{t('studio.result.v2.basket.quantity', 'تعداد')}</span>
                  <button
                    type="button"
                    onClick={() => item.isMain
                      ? onUpdateQuantity?.(item.group.itemId, Math.max(1, item.quantity - 1))
                      : onUpdateProductQuantity?.(item.product.id, Math.max(1, item.quantity - 1))}
                    disabled={item.quantity <= 1}
                    aria-label={t('basket.decrease', 'کاهش تعداد')}
                  >
                    <Minus size={14} />
                  </button>
                  <span>{toLocalizedDigits(item.quantity)}</span>
                  <button
                    type="button"
                    onClick={() => item.isMain
                      ? onUpdateQuantity?.(item.group.itemId, Math.min(99, item.quantity + 1))
                      : onUpdateProductQuantity?.(item.product.id, Math.min(99, item.quantity + 1))}
                    disabled={item.quantity >= 99}
                    aria-label={t('basket.increase', 'افزایش تعداد')}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="studio-invoice-item-price">
                <strong dir="ltr">{formatPriceFromRial(item.lineTotal, false)}</strong>
                <span>{t('common.toman', 'تومان')}</span>
                <button
                  type="button"
                  onClick={() => onToggleBasketProduct?.(item.product.id)}
                  aria-pressed={true}
                  aria-label={`${t('basket.remove', 'حذف')} ${item.product.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="studio-invoice-total">
        <div>
          <span>{t('studio.result.v2.basket.selectedTotal', 'جمع انتخاب‌ها')}</span>
          <small>{t('studio.result.v2.basket.estimated', 'هزینه محصولات تخمینی است')}</small>
        </div>
        <strong dir="ltr">{formatPriceFromRial(selectedPrice, true)}</strong>
      </div>

      <p className="studio-invoice-note">
        {t('studio.result.v2.basket.installationNote', 'هزینه ارسال، اجرا و نصب جداگانه محاسبه می‌شود و در این مبلغ نیامده است.')}
      </p>

      {onFinalize && (
        <button type="button" className="studio-primary-button studio-invoice-finalize" onClick={onFinalize} disabled={basketItems.length === 0 || isFinalizing}>
          {isFinalizing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {isFinalizing ? t('studio.result.v2.basket.finalizing', 'در حال آماده‌سازی سبد...') : t('studio.result.v2.basket.finalize', 'مشاهده سبد و ادامه به پرداخت')}
          {!isFinalizing && <ArrowLeft size={18} />}
        </button>
      )}
    </section>
  );
}
