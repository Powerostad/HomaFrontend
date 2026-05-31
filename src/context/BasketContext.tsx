/**
 * BasketContext — unified shopping basket state.
 *
 * Server-authoritative: every mutation hits /api/basket/* and the response
 * (the full basket) replaces local state.
 *
 * Mutations are **serialized** through a promise chain so that responses are
 * always applied in submission order — concurrent adds/updates can never leave
 * the UI showing a stale basket. updateQuantity/removeItem additionally apply
 * an optimistic update for instant feedback, rolling back on failure.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

import { basketService } from '@/services/basketService';
import { trackEvent } from '@/utils/analytics';
import { AUTH_LOGIN_EVENT, AUTH_LOGOUT_EVENT } from '@/utils/apiClient';
import {
  EMPTY_BASKET,
  type AddToBasketInput,
  type Basket,
  type CheckoutResult,
} from '@/types/basket';

interface BasketContextValue {
  basket: Basket;
  isLoading: boolean;
  isMutating: boolean;
  isOpen: boolean;
  itemCount: number;
  totalRial: number;
  priceDrift: boolean;
  hasUnavailable: boolean;
  openBasket: () => void;
  closeBasket: () => void;
  refresh: () => Promise<void>;
  addItem: (input: AddToBasketInput) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  acceptPrice: (itemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  mergeAfterLogin: (sessionId: string) => Promise<void>;
  checkout: (itemIds?: string[], shopId?: number, acceptChanges?: boolean) => Promise<CheckoutResult | null>;
  confirmCheckout: () => Promise<void>;
}

const BasketContext = createContext<BasketContextValue | undefined>(undefined);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [basket, setBasketState] = useState<Basket>(EMPTY_BASKET);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadedRef = useRef(false);
  // Mirror of `basket` for reading the latest value inside async callbacks.
  const basketRef = useRef<Basket>(EMPTY_BASKET);
  // Serializes basket mutations so responses apply in submission order.
  const mutationChain = useRef<Promise<unknown>>(Promise.resolve());
  const pendingCount = useRef(0);

  const setBasket = useCallback((next: Basket) => {
    basketRef.current = next;
    setBasketState(next);
  }, []);

  /** Run `fn` after all previously-queued mutations have settled. */
  const runExclusive = useCallback(<T,>(fn: () => Promise<T>): Promise<T> => {
    pendingCount.current += 1;
    setIsMutating(true);
    const result = mutationChain.current.then(fn, fn);
    mutationChain.current = result
      .catch(() => undefined)
      .finally(() => {
        pendingCount.current -= 1;
        if (pendingCount.current === 0) setIsMutating(false);
      });
    return result;
  }, []);

  const refresh = useCallback(async () => {
    const res = await basketService.fetchBasket();
    if (res.success && res.data) setBasket(res.data);
    setIsLoading(false);
  }, [setBasket]);

  // Hydrate once on mount.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void refresh();
  }, [refresh]);

  const openBasket = useCallback(() => setIsOpen(true), []);
  const closeBasket = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    (input: AddToBasketInput): Promise<boolean> =>
      runExclusive(async () => {
        const res = await basketService.addItem(input);
        if (res.success && res.data) {
          setBasket(res.data);
          trackEvent('basket_added', {
            product_unique_link: input.product_unique_link,
            source_context: input.source_context,
          });
          return true;
        }
        toast.error(res.error || 'خطا در افزودن به سبد خرید');
        return false;
      }),
    [runExclusive, setBasket]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number): Promise<void> =>
      runExclusive(async () => {
        const prev = basketRef.current;
        setBasket(applyQuantity(prev, itemId, quantity)); // optimistic
        const res = await basketService.updateQuantity(itemId, quantity);
        if (res.success && res.data) {
          setBasket(res.data);
          trackEvent('basket_qty_changed', { item_id: itemId, quantity });
        } else {
          setBasket(prev); // rollback
          toast.error(res.error || 'خطا در به‌روزرسانی سبد خرید');
        }
      }),
    [runExclusive, setBasket]
  );

  const removeItem = useCallback(
    (itemId: string): Promise<void> =>
      runExclusive(async () => {
        const prev = basketRef.current;
        setBasket(removeItemLocal(prev, itemId)); // optimistic
        const res = await basketService.removeItem(itemId);
        if (res.success && res.data) {
          setBasket(res.data);
          trackEvent('basket_removed', { item_id: itemId });
        } else {
          setBasket(prev); // rollback
          toast.error(res.error || 'خطا در حذف آیتم');
        }
      }),
    [runExclusive, setBasket]
  );

  const acceptPrice = useCallback(
    (itemId: string): Promise<void> =>
      runExclusive(async () => {
        const res = await basketService.acceptPrice(itemId);
        if (res.success && res.data) {
          setBasket(res.data);
          trackEvent('basket_price_drift_accepted', { item_id: itemId });
        } else {
          toast.error(res.error || 'خطا در تأیید قیمت');
        }
      }),
    [runExclusive, setBasket]
  );

  const clear = useCallback(
    (): Promise<void> =>
      runExclusive(async () => {
        const res = await basketService.clearBasket();
        if (res.success && res.data) {
          setBasket(res.data);
        } else {
          toast.error(res.error || 'خطا در خالی کردن سبد خرید');
        }
      }),
    [runExclusive, setBasket]
  );

  const mergeAfterLogin = useCallback(
    (sessionId: string): Promise<void> =>
      runExclusive(async () => {
        const res = await basketService.mergeAnonymousBasket(sessionId);
        if (res.success && res.data) {
          setBasket(res.data);
          if (res.data.item_count > 0) {
            trackEvent('basket_anon_merged', {
              item_count: res.data.item_count,
            });
          }
        } else {
          // Merge failed — tell the user (their guest items may not have
          // carried over) and fall back to the user's server-side basket.
          toast.error(res.error || 'خطا در ادغام سبد خرید');
          await refresh();
        }
      }),
    [runExclusive, setBasket, refresh]
  );

  const checkout = useCallback(
    (itemIds?: string[], shopId?: number, acceptChanges = false): Promise<CheckoutResult | null> =>
      runExclusive(async () => {
        const res = await basketService.checkout(itemIds, shopId, acceptChanges);
        if (res.success && res.data) {
          // A review-required result re-reads the basket so the price/availability
          // banners reflect the freshly-detected changes.
          if (res.data.requires_review) {
            await refresh();
          } else {
            trackEvent('basket_checkout_initiated', {
              shop_count: res.data.total_shops,
              item_count: res.data.total_items,
            });
          }
          return res.data;
        }
        toast.error(res.error || 'خطا در نهایی کردن خرید');
        return null;
      }),
    [runExclusive, refresh]
  );

  const confirmCheckout = useCallback(
    (): Promise<void> =>
      runExclusive(async () => {
        const res = await basketService.confirmCheckout();
        // The basket is now CONVERTED; a fresh GET returns a new empty basket.
        if (res.success) {
          const fresh = await basketService.fetchBasket();
          setBasket(fresh.success && fresh.data ? fresh.data : EMPTY_BASKET);
        }
      }),
    [runExclusive, setBasket]
  );

  // On login, merge the anonymous basket into the user's basket. On logout,
  // re-hydrate so the UI drops the logged-out user's basket and shows the
  // anonymous-session basket instead (important on shared devices).
  useEffect(() => {
    const handleLogin = () => {
      let sessionId: string | null = null;
      try {
        sessionId = localStorage.getItem('homa_session_id');
      } catch {
        sessionId = null;
      }
      if (sessionId) {
        void mergeAfterLogin(sessionId);
      } else {
        void refresh();
      }
    };
    const handleLogout = () => {
      void refresh();
    };
    window.addEventListener(AUTH_LOGIN_EVENT, handleLogin);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => {
      window.removeEventListener(AUTH_LOGIN_EVENT, handleLogin);
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    };
  }, [mergeAfterLogin, refresh]);

  const value: BasketContextValue = {
    basket,
    isLoading,
    isMutating,
    isOpen,
    itemCount: basket.item_count,
    totalRial: basket.total_rial,
    priceDrift: basket.price_drift,
    hasUnavailable: basket.has_unavailable,
    openBasket,
    closeBasket,
    refresh,
    addItem,
    updateQuantity,
    acceptPrice,
    removeItem,
    clear,
    mergeAfterLogin,
    checkout,
    confirmCheckout,
  };

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket(): BasketContextValue {
  const ctx = useContext(BasketContext);
  if (ctx === undefined) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return ctx;
}

// --- local optimistic helpers --------------------------------------------

function applyQuantity(basket: Basket, itemId: string, quantity: number): Basket {
  return {
    ...basket,
    shop_groups: basket.shop_groups.map((g) => ({
      ...g,
      items: g.items.map((i) =>
        i.id === itemId
          ? { ...i, quantity, line_total_rial: i.snapshot_price_rial * quantity }
          : i
      ),
    })),
  };
}

function removeItemLocal(basket: Basket, itemId: string): Basket {
  return {
    ...basket,
    shop_groups: basket.shop_groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.id !== itemId) }))
      .filter((g) => g.items.length > 0),
  };
}
