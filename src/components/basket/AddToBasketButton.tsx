/**
 * AddToBasketButton — adds a product to the unified basket from any flow.
 *
 * Mirrors the BuyButton API for consistency. Sits *next to* BuyButton (it does
 * not replace it — some users want immediate single-product checkout).
 *
 * Once the product is in the basket, the button morphs into a compact qty
 * stepper bound live to BasketContext. The morph happens *optimistically* on
 * click so the tap feels instant; it reverts if the server rejects the add.
 */
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';
import { useBasket } from '../../context/AppProviders';
import { toPersianDigits } from '../../utils/formatters';
import type {
  AddToBasketOriginRefs,
  BasketSourceContext,
} from '../../types/basket';

interface AddToBasketButtonProps extends AddToBasketOriginRefs {
  /** Product.unique_link (UUID). */
  productUniqueLink: string;
  variantId?: number | null;
  sourceContext: BasketSourceContext;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function AddToBasketButton({
  productUniqueLink,
  variantId = null,
  sourceContext,
  variant = 'default',
  size = 'default',
  className = '',
  ...originRefs
}: AddToBasketButtonProps) {
  const { t } = useTranslation();
  const { basket, addItem, updateQuantity } = useBasket();
  const [isAdding, setIsAdding] = useState(false);
  // Optimistic flag: the button shows the stepper the instant it is tapped,
  // before the server round-trip resolves. Cleared on failure, and once the
  // real basket item arrives (see effect below).
  const [optimistic, setOptimistic] = useState(false);

  const existingItem = useMemo(() => {
    for (const group of basket.shop_groups) {
      for (const item of group.items) {
        if (
          item.product_unique_link === productUniqueLink &&
          (item.variant_id ?? null) === (variantId ?? null)
        ) {
          return item;
        }
      }
    }
    return null;
  }, [basket, productUniqueLink, variantId]);

  // Once the real item lands, the optimistic flag has done its job.
  useEffect(() => {
    if (existingItem) setOptimistic(false);
  }, [existingItem]);

  const handleAdd = async () => {
    setIsAdding(true);
    setOptimistic(true); // instant feedback — morph to stepper now
    try {
      const ok = await addItem({
        product_unique_link: productUniqueLink,
        variant_id: variantId,
        quantity: 1,
        source_context: sourceContext,
        ...originRefs,
      });
      if (!ok) setOptimistic(false); // server rejected — revert to add button
    } finally {
      setIsAdding(false);
    }
  };

  // Already in basket (or optimistically added) → show a compact stepper.
  if (existingItem || optimistic) {
    // During the optimistic window there is no real item id yet, so the
    // +/- controls stay inert until the server response arrives.
    const quantity = existingItem?.quantity ?? 1;
    const pending = existingItem === null;
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-md border border-default ${className}`}
        dir="ltr"
      >
        <button
          type="button"
          onClick={() =>
            existingItem &&
            updateQuantity(existingItem.id, existingItem.quantity + 1)
          }
          disabled={pending || quantity >= 99}
          className="h-8 w-8 flex items-center justify-center text-content-secondary hover:text-content-primary disabled:opacity-40"
          aria-label={t('basket.increase', 'افزایش')}
        >
          <Plus size={14} />
        </button>
        <span className="min-w-[28px] text-center text-sm font-medium tabular-nums">
          {toPersianDigits(quantity)}
        </span>
        <button
          type="button"
          onClick={() =>
            existingItem &&
            updateQuantity(existingItem.id, Math.max(1, existingItem.quantity - 1))
          }
          disabled={pending || quantity <= 1}
          className="h-8 w-8 flex items-center justify-center text-content-secondary hover:text-content-primary disabled:opacity-40"
          aria-label={t('basket.decrease', 'کاهش')}
        >
          <Minus size={14} />
        </button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isAdding}
      onClick={handleAdd}
      data-ph-capture-attribute-action="add-to-basket"
    >
      {isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingBag className="h-4 w-4" />
      )}
      {t('basket.add', 'افزودن به سبد')}
    </Button>
  );
}

export default AddToBasketButton;
