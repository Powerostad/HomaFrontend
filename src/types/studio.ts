// =============================================================================
// Re-export API types from service for convenience
// =============================================================================
export type {
  SessionStatus,
  APIRedesignSession,
  APISessionItem,
  APIMatchedProduct,
  RedesignSession,
  SessionItem,
  MatchedProduct,
  SessionListItem,
} from '@/services/studioService';

// =============================================================================
// Legacy Frontend Types (for backwards compatibility with existing pages)
// =============================================================================

/**
 * Legacy recommendation type used in existing UI components
 * Maps to MatchedProduct from API
 */
export interface StudioRecommendation {
  id: string;
  name: string;
  price: number;
  category: 'کف' | 'نور' | 'دیوار' | 'اکسسوری';
  image: string;
  store: string;
  status: 'none' | 'added' | 'liked' | 'hidden';
}

/**
 * Legacy session type used in existing UI components
 * Will be gradually replaced by RedesignSession from API
 */
export interface StudioSession {
  id: string;
  createdAt: string;
  brief: {
    style: string;
    budget: string;
    constraints: string[];
  };
  recommendations: StudioRecommendation[];
  summary: string;
  isPinned?: boolean;
}

/**
 * Legacy project type for localStorage-based projects
 * Projects are now sessions in the API
 */
export interface StudioProject {
  id: string;
  name: string;
  createdAt: string;
  thumbnail?: string;
  sessions: StudioSession[];
  shoppingList: string[]; // IDs of products from sessions added to project list
}

// =============================================================================
// Helper functions to convert between legacy and API types
// =============================================================================

import type { MatchedProduct, SessionItem } from '@/services/studioService';

/**
 * Map product category from API to legacy Persian categories
 */
function mapCategoryToLegacy(category?: string): 'کف' | 'نور' | 'دیوار' | 'اکسسوری' {
  const categoryMap: Record<string, 'کف' | 'نور' | 'دیوار' | 'اکسسوری'> = {
    'rug': 'کف',
    'floor': 'کف',
    'carpet': 'کف',
    'light': 'نور',
    'lamp': 'نور',
    'lighting': 'نور',
    'wall': 'دیوار',
    'wallpaper': 'دیوار',
    'decor': 'اکسسوری',
    'accessory': 'اکسسوری',
  };
  return categoryMap[category?.toLowerCase() || ''] || 'اکسسوری';
}

/**
 * Convert API MatchedProduct to legacy StudioRecommendation
 */
export function toStudioRecommendation(product: MatchedProduct): StudioRecommendation {
  return {
    id: String(product.id),
    name: product.name,
    price: product.price,
    category: mapCategoryToLegacy(product.category),
    image: product.imageUrl,
    store: product.shopName || 'فروشگاه هوما',
    status: 'none',
  };
}

/**
 * Convert API SessionItem items to legacy StudioRecommendation array
 */
export function sessionItemsToRecommendations(items: SessionItem[]): StudioRecommendation[] {
  return items.flatMap(item =>
    item.matchedProducts.map(product => toStudioRecommendation(product))
  );
}
