/**
 * CheckoutConfirmModal — final step of basket checkout.
 *
 * A basket can span several shops; checkout opens one UTM-tracked tracking URL
 * per item. Browsers block bulk window.open() calls, so we:
 *   1. warn the user how many shops they'll be sent to,
 *   2. open the tabs with a small stagger,
 *   3. always render the links as clickable cards as a popup-blocker fallback.
 */
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { apiConfig } from '../../utils/apiClient';
import { trackEvent } from '../../utils/analytics';
import { toPersianDigits, formatPriceFromRial } from '../../utils/formatters';
import type { CheckoutLine, CheckoutResult } from '../../types/basket';

interface CheckoutConfirmModalProps {
  result: CheckoutResult | null;
  open: boolean;
  onClose: () => void;
  /** Called once the tabs have been opened, so the basket can be confirmed. */
  onConfirmed: () => void;
}

function resolveTrackingUrl(line: CheckoutLine): string {
  // Rebuild the tracking URL from the frontend's API base — mirrors BuyButton,
  // which does this because the backend's BACKEND_BASE_URL can be misconfigured.
  return `${apiConfig.baseURL}/tracking/go/${line.click_event_id}/`;
}

export function CheckoutConfirmModal({
  result,
  open,
  onClose,
  onConfirmed,
}: CheckoutConfirmModalProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  // Each item's click-through is reported at most once, no matter how many
  // paths reach it (Open-All stagger + the popup-blocker fallback link).
  const trackedRef = useRef<Set<string>>(new Set());

  // A fresh checkout result is a fresh set of items — start tracking clean.
  useEffect(() => {
    trackedRef.current = new Set();
  }, [result]);

  if (!result) return null;

  const allLines = result.shops.flatMap((s) => s.items);

  const trackClickThrough = (basketItemId: string | undefined) => {
    if (!basketItemId || trackedRef.current.has(basketItemId)) return;
    trackedRef.current.add(basketItemId);
    trackEvent('basket_item_clicked_through', { basket_item_id: basketItemId });
  };

  const handleOpenAll = () => {
    // Stagger the window.open calls to dodge popup blockers.
    allLines.forEach((line, index) => {
      window.setTimeout(() => {
        window.open(resolveTrackingUrl(line), '_blank', 'noopener');
        trackClickThrough(line.basket_item_id);
      }, index * 150);
    });
    setOpened(true);
    onConfirmed();
  };

  const handleClose = () => {
    setOpened(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t('basket.checkoutTitle', 'تکمیل خرید')}</DialogTitle>
          <DialogDescription>
            {t('basket.multiShopNotice', {
              defaultValue: `شما به ${toPersianDigits(result.total_shops)} فروشگاه هدایت می‌شوید`,
              shops: toPersianDigits(result.total_shops),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto space-y-4 py-2">
          {result.shops.map((shop) => (
            <div key={shop.shop_id} className="space-y-2">
              <div className="flex items-center gap-2 text-content-secondary text-sm">
                <Store size={14} />
                <span>{shop.shop_name}</span>
              </div>
              {shop.items.map((line) => (
                <a
                  key={line.basket_item_id}
                  href={resolveTrackingUrl(line)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClickThrough(line.basket_item_id)}
                  className="flex items-center justify-between gap-3 rounded-md border border-subtle p-3 hover:border-default transition-colors"
                >
                  <span className="text-sm text-content-primary line-clamp-1">
                    {line.product_name}
                  </span>
                  <span className="flex items-center gap-2 shrink-0 text-xs text-content-muted">
                    {formatPriceFromRial(line.snapshot_price_rial)}
                    <ExternalLink size={14} />
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>

        <p className="text-xs text-content-muted">
          {t(
            'basket.popupWarning',
            'اگر صفحه‌ای باز نشد، روی هر مورد بالا کلیک کنید.'
          )}
        </p>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleOpenAll}>
            {opened
              ? t('basket.openAgain', 'باز کردن دوباره')
              : t('basket.openAllShops', 'رفتن به فروشگاه‌ها')}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            {t('common.close', 'بستن')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CheckoutConfirmModal;
