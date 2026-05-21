/**
 * BasketPage — full-page view of the unified basket at /basket.
 *
 * Deep-linkable companion to the BasketSheet. Same data, roomier layout.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { CheckoutConfirmModal } from '../../components/basket/CheckoutConfirmModal';
import { useBasket } from '../../context/AppProviders';
import { formatPriceFromRial, toPersianDigits } from '../../utils/formatters';
import type { CheckoutResult } from '../../types/basket';

export function BasketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    basket,
    isLoading,
    itemCount,
    totalRial,
    isMutating,
    updateQuantity,
    removeItem,
    acceptPrice,
    clear,
    checkout,
    confirmCheckout,
  } = useBasket();

  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(
    null
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const runCheckout = async (shopId?: number) => {
    const result = await checkout(undefined, shopId);
    if (result && result.total_items > 0) {
      setCheckoutResult(result);
      setCheckoutOpen(true);
    }
  };

  const isEmpty = itemCount === 0;

  return (
    <div className="min-h-screen bg-surface-page" dir="rtl">
      <Header />

      <main className="mx-auto px-6 md:px-12 py-8" style={{ maxWidth: 'var(--max-width-content)' }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-content-primary flex items-center gap-2">
            <ShoppingBag size={22} strokeWidth={1.5} />
            {t('basket.title', 'سبد خرید')}
            {!isEmpty && (
              <span className="text-content-muted font-normal text-base">
                ({toPersianDigits(itemCount)})
              </span>
            )}
          </h1>
          {!isEmpty && (
            <button
              type="button"
              onClick={() => clear()}
              className="text-sm text-content-muted hover:text-brand-primary"
            >
              {t('basket.clearAll', 'خالی کردن سبد')}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-content-muted" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <ShoppingBag size={48} className="text-content-muted" strokeWidth={1} />
            <p className="text-content-secondary">
              {t('basket.empty', 'سبد خرید شما خالی است')}
            </p>
            <Button variant="outline" onClick={() => navigate('/explore')}>
              {t('basket.browseProducts', 'مشاهده محصولات')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* items */}
            <div className="lg:col-span-2 space-y-4">
              {basket.shop_groups.map((group) => (
                <div
                  key={group.shop_id}
                  className="rounded-lg border border-subtle bg-surface-default p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-content-secondary">
                      <Store size={15} />
                      <span>{group.shop_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => runCheckout(group.shop_id)}
                      disabled={isMutating}
                      className="text-xs text-brand-primary font-medium disabled:opacity-50"
                    >
                      {t('basket.checkoutShop', 'خرید از این فروشگاه')}
                    </button>
                  </div>

                  <div className="divide-y divide-subtle">
                    {group.items.map((item) => {
                      const unavailable = item.status === 'unavailable';
                      return (
                        <div
                          key={item.id}
                          className={`flex gap-4 py-4 ${unavailable ? 'opacity-60' : ''}`}
                        >
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-page">
                            {item.product_image_url && (
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm text-content-primary ${
                                unavailable ? 'line-through' : ''
                              }`}
                            >
                              {item.product_name}
                            </p>
                            {item.variant_label && (
                              <p className="text-xs text-content-muted mt-0.5">
                                {item.variant_label}
                              </p>
                            )}

                            {unavailable ? (
                              <p className="text-xs text-brand-primary mt-2">
                                {t('basket.unavailable', 'این محصول دیگر موجود نیست')}
                              </p>
                            ) : (
                              <div className="flex items-center gap-4 mt-3">
                                <div
                                  className="inline-flex items-center gap-1 rounded-md border border-subtle"
                                  dir="ltr"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(item.id, item.quantity + 1)
                                    }
                                    disabled={item.quantity >= 99}
                                    className="h-7 w-7 flex items-center justify-center text-content-secondary hover:text-content-primary disabled:opacity-40"
                                  >
                                    <Plus size={13} />
                                  </button>
                                  <span className="min-w-[28px] text-center text-xs font-medium tabular-nums">
                                    {toPersianDigits(item.quantity)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(
                                        item.id,
                                        Math.max(1, item.quantity - 1)
                                      )
                                    }
                                    disabled={item.quantity <= 1}
                                    className="h-7 w-7 flex items-center justify-center text-content-secondary hover:text-content-primary disabled:opacity-40"
                                  >
                                    <Minus size={13} />
                                  </button>
                                </div>
                                <span className="text-sm font-medium text-content-primary">
                                  {formatPriceFromRial(item.line_total_rial)}
                                </span>
                              </div>
                            )}

                            {item.price_changed && !unavailable && (
                              <div className="mt-2 flex items-center gap-2 rounded-md bg-surface-page p-2">
                                <AlertTriangle
                                  size={13}
                                  className="text-brand-primary shrink-0"
                                />
                                <span className="text-xs text-content-secondary flex-1">
                                  {t('basket.priceChanged', 'قیمت تغییر کرده است')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => acceptPrice(item.id)}
                                  className="text-xs text-brand-primary font-medium"
                                >
                                  {t('basket.acceptNewPrice', 'تأیید قیمت جدید')}
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="self-start p-1 text-content-muted hover:text-brand-primary"
                            aria-label={t('basket.remove', 'حذف')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* summary */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-subtle bg-surface-default p-5 sticky top-24 space-y-4">
                <h2 className="text-sm font-medium text-content-primary">
                  {t('basket.summary', 'خلاصه سبد خرید')}
                </h2>
                <div className="flex justify-between text-sm text-content-secondary">
                  <span>{t('basket.itemsCount', 'تعداد اقلام')}</span>
                  <span>{toPersianDigits(itemCount)}</span>
                </div>
                <div className="flex justify-between border-t border-subtle pt-3">
                  <span className="text-content-secondary">
                    {t('basket.total', 'مجموع')}
                  </span>
                  <span className="text-lg font-semibold text-content-primary">
                    {formatPriceFromRial(totalRial)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  disabled={isMutating}
                  onClick={() => runCheckout()}
                >
                  {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('basket.checkout', 'تکمیل خرید')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <CheckoutConfirmModal
        result={checkoutResult}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onConfirmed={() => void confirmCheckout()}
      />
    </div>
  );
}

export default BasketPage;
