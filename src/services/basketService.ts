/**
 * Basket Service — سرویس سبد خرید
 *
 * Thin wrapper over the /api/basket/* endpoints. The apiClient automatically
 * attaches the JWT (when present) and the X-Homa-Session header, so anonymous
 * and authenticated baskets are both handled transparently.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '@/utils/apiClient';
import type {
  Basket,
  CheckoutResult,
  AddToBasketInput,
} from '@/types/basket';

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** GET /api/basket/ — fetch the current basket. */
export async function fetchBasket(): Promise<ServiceResult<Basket>> {
  const res = await apiGet<Basket>('/basket/');
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در دریافت سبد خرید' };
}

/** POST /api/basket/items/ — add an item. */
export async function addItem(
  input: AddToBasketInput
): Promise<ServiceResult<Basket>> {
  const res = await apiPost<Basket>('/basket/items/', {
    product_unique_link: input.product_unique_link,
    variant_id: input.variant_id ?? null,
    quantity: input.quantity ?? 1,
    source_context: input.source_context,
    processed_image_id: input.processed_image_id ?? null,
    redesign_session_id: input.redesign_session_id ?? null,
    session_item_id: input.session_item_id ?? null,
    gallery_submission_id: input.gallery_submission_id ?? null,
  });
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در افزودن به سبد خرید' };
}

/** PATCH /api/basket/items/{id}/ — update quantity. */
export async function updateQuantity(
  itemId: string,
  quantity: number
): Promise<ServiceResult<Basket>> {
  const res = await apiPatch<Basket>(`/basket/items/${itemId}/`, { quantity });
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در به‌روزرسانی سبد خرید' };
}

/** PATCH /api/basket/items/{id}/accept_price/ — accept a changed price. */
export async function acceptPrice(
  itemId: string
): Promise<ServiceResult<Basket>> {
  const res = await apiPatch<Basket>(
    `/basket/items/${itemId}/accept_price/`,
    {}
  );
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در تأیید قیمت' };
}

/** DELETE /api/basket/items/{id}/ — remove an item. */
export async function removeItem(
  itemId: string
): Promise<ServiceResult<Basket>> {
  const res = await apiDelete<Basket>(`/basket/items/${itemId}/`);
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در حذف آیتم' };
}

/** DELETE /api/basket/clear/ — empty the basket. */
export async function clearBasket(): Promise<ServiceResult<Basket>> {
  const res = await apiDelete<Basket>('/basket/clear/');
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در خالی کردن سبد خرید' };
}

/** POST /api/basket/merge/ — merge the anonymous basket after login. */
export async function mergeAnonymousBasket(
  sessionId: string
): Promise<ServiceResult<Basket>> {
  const res = await apiPost<Basket>('/basket/merge/', { session_id: sessionId });
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در ادغام سبد خرید' };
}

/** POST /api/basket/checkout/ — build per-item tracking URLs grouped by shop. */
export async function checkout(
  itemIds?: string[],
  shopId?: number
): Promise<ServiceResult<CheckoutResult>> {
  const body: Record<string, unknown> = {};
  if (itemIds && itemIds.length) body.item_ids = itemIds;
  if (shopId != null) body.shop_id = shopId;
  const res = await apiPost<CheckoutResult>('/basket/checkout/', body);
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در نهایی کردن خرید' };
}

/** POST /api/basket/checkout/confirm/ — mark the basket converted. */
export async function confirmCheckout(): Promise<ServiceResult<Basket>> {
  const res = await apiPost<Basket>('/basket/checkout/confirm/', {});
  return res.success
    ? { success: true, data: res.data }
    : { success: false, error: res.error || 'خطا در تأیید خرید' };
}

export const basketService = {
  fetchBasket,
  addItem,
  updateQuantity,
  acceptPrice,
  removeItem,
  clearBasket,
  mergeAnonymousBasket,
  checkout,
  confirmCheckout,
};

export default basketService;
