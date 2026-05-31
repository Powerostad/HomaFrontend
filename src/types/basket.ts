/**
 * Basket types — mirror the backend apps/basket DTOs.
 *
 * The basket is the unified cross-flow conversion funnel: items can be added
 * from product pages, try-on results, studio, the gallery, and explore/store
 * cards, then checked out as UTM-tracked outbound links grouped by shop.
 */

export type BasketItemStatus =
  | 'available'
  | 'unavailable'
  | 'price_changed'
  | 'removed';

export type BasketSourceContext =
  | 'product_page'
  | 'try_on_result'
  | 'studio'
  | 'gallery'
  | 'explore'
  | 'search';

export interface BasketItem {
  id: string;
  product_id: number;
  product_unique_link: string;
  product_name: string;
  product_image_url: string;
  variant_id: number | null;
  variant_label: string;
  shop_id: number;
  shop_name: string;
  quantity: number;
  status: BasketItemStatus;
  snapshot_price_rial: number;
  current_price_rial: number | null;
  price_changed: boolean;
  line_total_rial: number;
  source_context: BasketSourceContext;
  processed_image_id: number | null;
  redesign_session_id: string | null;
  session_item_id: number | null;
  gallery_submission_id: number | null;
  added_at: string;
  updated_at: string;
}

export interface BasketShopGroup {
  shop_id: number;
  shop_name: string;
  items: BasketItem[];
  subtotal_rial: number;
}

export interface Basket {
  id: string;
  status: 'active' | 'merged' | 'abandoned' | 'converted';
  item_count: number;
  total_rial: number;
  shop_groups: BasketShopGroup[];
  has_unavailable: boolean;
  price_drift: boolean;
  updated_at: string;
  etag: string;
}

export interface CheckoutLine {
  basket_item_id: string;
  click_event_id: string;
  tracking_url: string;
  product_name: string;
  snapshot_price_rial: number;
  quantity: number;
}

export interface CheckoutShopGroup {
  shop_id: number;
  shop_name: string;
  items: CheckoutLine[];
}

/** A price/availability change (vs. the source site's last crawl) the user
 *  must confirm before checkout proceeds. */
export interface CheckoutChange {
  basket_item_id: string;
  product_name: string;
  change_type: 'price' | 'unavailable';
  old_price_rial: number;
  new_price_rial: number | null;
}

export interface CheckoutResult {
  shops: CheckoutShopGroup[];
  total_items: number;
  total_shops: number;
  /** When true, no links were generated — `changes` need confirmation. */
  requires_review: boolean;
  changes: CheckoutChange[];
}

/** Origin pointers passed when adding an item, for conversion attribution. */
export interface AddToBasketOriginRefs {
  processed_image_id?: number | null;
  redesign_session_id?: string | null;
  session_item_id?: number | null;
  gallery_submission_id?: number | null;
}

export interface AddToBasketInput extends AddToBasketOriginRefs {
  /** Product.unique_link (UUID) — same identifier the tracking endpoint uses. */
  product_unique_link: string;
  variant_id?: number | null;
  quantity?: number;
  source_context: BasketSourceContext;
}

export const EMPTY_BASKET: Basket = {
  id: '',
  status: 'active',
  item_count: 0,
  total_rial: 0,
  shop_groups: [],
  has_unavailable: false,
  price_drift: false,
  updated_at: '',
  etag: '',
};
