/**
 * BasketSheet — the global slide-over basket.
 *
 * Rendered once at the app root (see Layout). Opens from the header bag icon
 * or programmatically via useBasket().openBasket(). Items are grouped by shop
 * because a basket routinely spans several vendors; checkout is available per
 * shop and for the whole basket.
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

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { useBasket } from '../../context/AppProviders';
import { formatPriceFromRial, toPersianDigits } from '../../utils/formatters';
import { CheckoutConfirmModal } from './CheckoutConfirmModal';
import { CheckoutReviewModal } from './CheckoutReviewModal';
import type { BasketItem, CheckoutChange, CheckoutResult } from '../../types/basket';

function BasketLine({
  item,
}: {
  item: BasketItem;
}) {
  const { t } = useTranslation();
  const { updateQuantity, removeItem, acceptPrice } = useBasket();
  const unavailable = item.status === 'unavailable';

  return (
    <div
      className={`flex gap-3 py-3 ${unavailable ? 'opacity-60' : ''}`}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-default">
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
          className={`text-sm text-content-primary line-clamp-2 ${
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
          <p className="text-xs text-brand-primary mt-1">
            {t('basket.unavailable', 'این محصول دیگر موجود نیست')}
          </p>
        ) : (
          <div className="flex items-center justify-between mt-2">
            {/* qty stepper */}
            <div
              className="inline-flex items-center gap-1 rounded-md border border-subtle"
              dir="ltr"
            >
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= 99}
                className="h-7 w-7 flex items-center justify-center text-content-secondary hover:text-content-primary disabled:opacity-40"
                aria-label={t('basket.increase', 'افزایش')}
              >
                <Plus size={13} />
              </button>
              <span className="min-w-[24px] text-center text-xs font-medium tabular-nums">
                {toPersianDigits(item.quantity)}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.id, Math.max(1, item.quantity - 1))
                }
                disabled={item.quantity <= 1}
                className="h-7 w-7 flex items-center justify-center text-content-secondary hover:text-content-primary disabled:opacity-40"
                aria-label={t('basket.decrease', 'کاهش')}
              >
                <Minus size={13} />
              </button>
            </div>

            <span className="text-sm font-medium text-content-primary">
              {formatPriceFromRial(item.line_total_rial)}
            </span>
          </div>
        )}

        {/* price drift banner */}
        {item.price_changed && !unavailable && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-surface-default p-2">
            <AlertTriangle size={13} className="text-brand-primary shrink-0" />
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
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function BasketSheet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    basket,
    isOpen,
    closeBasket,
    itemCount,
    totalRial,
    isMutating,
    checkout,
    confirmCheckout,
  } = useBasket();

  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(
    null
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Review step (price/availability drift since add) — remembers which shop
  // scope to re-run once the user confirms.
  const [reviewChanges, setReviewChanges] = useState<CheckoutChange[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewShopId, setReviewShopId] = useState<number | undefined>(undefined);

  const runCheckout = async (shopId?: number, acceptChanges = false) => {
    const result = await checkout(undefined, shopId, acceptChanges);
    if (!result) return;
    if (result.requires_review) {
      setReviewChanges(result.changes);
      setReviewShopId(shopId);
      setReviewOpen(true);
      return;
    }
    if (result.total_items > 0) {
      setCheckoutResult(result);
      setCheckoutOpen(true);
    }
  };

  const handleConfirmReview = async () => {
    setReviewOpen(false);
    await runCheckout(reviewShopId, true);
  };

  const isEmpty = itemCount === 0;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(o) => !o && closeBasket()}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md flex flex-col p-0 z-modal"
          overlayClassName="z-modal-backdrop"
          dir="rtl"
        >
          <SheetHeader className="px-5 py-4 border-b border-subtle">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag size={18} />
              {t('basket.title', 'سبد خرید')}
              {!isEmpty && (
                <span className="text-sm text-content-muted font-normal">
                  ({toPersianDigits(itemCount)})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {isEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <ShoppingBag size={40} className="text-content-muted" strokeWidth={1} />
              <p className="text-content-secondary">
                {t('basket.empty', 'سبد خرید شما خالی است')}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5">
              {basket.shop_groups.map((group) => (
                <div key={group.shop_id} className="py-3 border-b border-subtle last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm text-content-secondary">
                      <Store size={14} />
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
                    {group.items.map((item) => (
                      <BasketLine key={item.id} item={item} />
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 text-xs text-content-muted">
                    <span>{t('basket.subtotal', 'جمع فروشگاه')}</span>
                    <span>{formatPriceFromRial(group.subtotal_rial)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isEmpty && (
            <div className="border-t border-subtle px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
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
                {isMutating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {t('basket.checkout', 'تکمیل خرید')}
              </Button>
              <button
                type="button"
                onClick={() => {
                  closeBasket();
                  navigate('/basket');
                }}
                className="w-full text-center text-xs text-content-muted hover:text-content-secondary"
              >
                {t('basket.viewFullPage', 'مشاهده صفحه کامل سبد خرید')}
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutReviewModal
        changes={reviewChanges}
        open={reviewOpen}
        busy={isMutating}
        onClose={() => setReviewOpen(false)}
        onConfirm={() => void handleConfirmReview()}
      />

      <CheckoutConfirmModal
        result={checkoutResult}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onConfirmed={() => void confirmCheckout()}
      />
    </>
  );
}

export default BasketSheet;
