import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { Shop } from "@/types/shop";
import { fetchShopByUsername } from "@/services/shopService";

/**
 * ShopContext - manages shop data with caching to prevent duplicate API calls
 *
 * When navigating between Store (/store/{slug}) and ProductDetails (/store/{slug}/product/{id}),
 * both pages need shop data. This context caches shop data by username/slug to avoid
 * redundant API calls.
 */

interface ShopCacheEntry {
  shop: Shop;
  timestamp: number;
}

interface ShopLoadingState {
  [username: string]: boolean;
}

interface ShopErrorState {
  [username: string]: string | null;
}

interface ShopContextType {
  /** Get shop from cache or fetch if not cached */
  getShop: (username: string, options?: { signal?: AbortSignal }) => Promise<Shop | null>;
  /** Get shop from cache only (no fetch) */
  getCachedShop: (username: string) => Shop | null;
  /** Check if shop is currently being fetched */
  isLoading: (username: string) => boolean;
  /** Get error for a specific shop fetch */
  getError: (username: string) => string | null;
  /** Invalidate cache for a specific shop */
  invalidateShop: (username: string) => void;
  /** Clear entire shop cache */
  clearCache: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Cache TTL: 5 minutes (shops don't change frequently)
const CACHE_TTL_MS = 5 * 60 * 1000;

export function ShopProvider({ children }: { children: ReactNode }) {
  // Using ref for cache to avoid re-renders on cache updates
  const cacheRef = useRef<Map<string, ShopCacheEntry>>(new Map());

  // Track in-flight requests to prevent duplicate concurrent fetches
  // Store both the promise and the signal so we can detect aborted requests
  const pendingRequestsRef = useRef<Map<string, { promise: Promise<Shop | null>; signal?: AbortSignal }>>(new Map());

  // Loading and error states (these trigger re-renders)
  const [loadingState, setLoadingState] = useState<ShopLoadingState>({});
  const [errorState, setErrorState] = useState<ShopErrorState>({});

  const isCacheValid = useCallback((entry: ShopCacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }, []);

  const getCachedShop = useCallback((username: string): Shop | null => {
    const normalizedUsername = username.toLowerCase();
    const entry = cacheRef.current.get(normalizedUsername);

    if (entry && isCacheValid(entry)) {
      return entry.shop;
    }

    return null;
  }, [isCacheValid]);

  const isLoading = useCallback((username: string): boolean => {
    return loadingState[username.toLowerCase()] ?? false;
  }, [loadingState]);

  const getError = useCallback((username: string): string | null => {
    return errorState[username.toLowerCase()] ?? null;
  }, [errorState]);

  const getShop = useCallback(async (
    username: string,
    options?: { signal?: AbortSignal }
  ): Promise<Shop | null> => {
    const normalizedUsername = username.toLowerCase();

    // 1. Check cache first
    const cachedShop = getCachedShop(normalizedUsername);
    if (cachedShop) {
      return cachedShop;
    }

    // 2. Check if there's already a pending request for this shop
    // Only reuse if the pending request's signal is not aborted
    const pending = pendingRequestsRef.current.get(normalizedUsername);
    if (pending && !pending.signal?.aborted) {
      return pending.promise;
    }

    // 3. Start new fetch
    setLoadingState(prev => ({ ...prev, [normalizedUsername]: true }));
    setErrorState(prev => ({ ...prev, [normalizedUsername]: null }));

    const fetchPromise = (async (): Promise<Shop | null> => {
      try {
        const result = await fetchShopByUsername(username, options);

        // Check if request was aborted - don't set error state for aborted requests
        // This handles React StrictMode double-mounting where first request gets aborted
        if (options?.signal?.aborted) {
          return null;
        }

        if (result.success && result.data) {
          // Cache the result
          cacheRef.current.set(normalizedUsername, {
            shop: result.data,
            timestamp: Date.now(),
          });

          setErrorState(prev => ({ ...prev, [normalizedUsername]: null }));
          return result.data;
        } else {
          setErrorState(prev => ({
            ...prev,
            [normalizedUsername]: result.error || 'فروشگاه یافت نشد'
          }));
          return null;
        }
      } catch (error) {
        // Don't set error for aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }
        // Also check the signal in case error doesn't have AbortError name
        if (options?.signal?.aborted) {
          return null;
        }

        const errorMessage = error instanceof Error
          ? error.message
          : 'خطا در دریافت اطلاعات فروشگاه';
        setErrorState(prev => ({ ...prev, [normalizedUsername]: errorMessage }));
        return null;
      } finally {
        setLoadingState(prev => ({ ...prev, [normalizedUsername]: false }));
        pendingRequestsRef.current.delete(normalizedUsername);
      }
    })();

    // Store the promise and signal so concurrent requests can await it
    // (and we can detect if the signal was aborted)
    pendingRequestsRef.current.set(normalizedUsername, {
      promise: fetchPromise,
      signal: options?.signal
    });

    return fetchPromise;
  }, [getCachedShop]);

  const invalidateShop = useCallback((username: string) => {
    const normalizedUsername = username.toLowerCase();
    cacheRef.current.delete(normalizedUsername);
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setErrorState({});
  }, []);

  return (
    <ShopContext.Provider
      value={{
        getShop,
        getCachedShop,
        isLoading,
        getError,
        invalidateShop,
        clearCache,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
