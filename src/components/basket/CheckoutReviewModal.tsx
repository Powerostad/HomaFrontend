/**
 * CheckoutReviewModal — shown when prices or availability changed (vs. the
 * source site's last crawl) since the items were added.
 *
 * Products are sold from external shops we crawl, so the authoritative price /
 * availability lives on the source site. Before sending the user there we ask
 * them to confirm the latest crawled values: drifted prices update, and items
 * the source no longer lists are dropped from the order.
 */
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { formatPriceFromRial } from '../../utils/formatters';
import type { CheckoutChange } from '../../types/basket';

interface CheckoutReviewModalProps {
  changes: CheckoutChange[];
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  /** Confirm the changes — re-runs checkout with accept_changes=true. */
  onConfirm: () => void;
}

export function CheckoutReviewModal({
  changes,
  open,
  busy = false,
  onClose,
  onConfirm,
}: CheckoutReviewModalProps) {
  const { t } = useTranslation();

  const hasUnavailable = changes.some((c) => c.change_type === 'unavailable');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-brand-primary" />
            {t('basket.reviewTitle', 'بررسی تغییرات')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'basket.reviewNotice',
              'قیمت یا موجودی برخی محصولات در فروشگاه مبدأ تغییر کرده است. لطفاً پیش از ادامه بررسی کنید.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto space-y-2 py-2">
          {changes.map((c) => (
            <div
              key={c.basket_item_id}
              className="flex items-center justify-between gap-3 rounded-md border border-subtle p-3"
            >
              <span className="text-sm text-content-primary line-clamp-1">
                {c.product_name}
              </span>
              {c.change_type === 'unavailable' ? (
                <span className="shrink-0 text-xs text-brand-primary">
                  {t('basket.reviewRemoved', 'ناموجود — حذف می‌شود')}
                </span>
              ) : (
                <span className="flex items-center gap-1 shrink-0 text-xs text-content-muted">
                  <span className="line-through">
                    {formatPriceFromRial(c.old_price_rial)}
                  </span>
                  <ArrowLeft size={12} />
                  <span className="text-content-primary font-medium">
                    {formatPriceFromRial(c.new_price_rial ?? c.old_price_rial)}
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>

        {hasUnavailable && (
          <p className="text-xs text-content-muted">
            {t(
              'basket.reviewUnavailableNote',
              'محصولات ناموجود به سفارش اضافه نمی‌شوند.'
            )}
          </p>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onConfirm} disabled={busy}>
            {t('basket.reviewConfirm', 'تأیید و ادامه به خرید')}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t('common.close', 'بستن')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CheckoutReviewModal;
