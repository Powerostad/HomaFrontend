/**
 * Types, constants and helpers for Studio Result Page
 *
 * Adapted from prototype (Homastudio01) for production use.
 * Uses real SessionItem and MatchedProduct types from studioService.
 */
import {
  Paintbrush,
  Wrench,
  HardHat,
} from 'lucide-react';
import type { SessionItem, MatchedProduct } from '../../../services/studioService';
import type { Product } from '../components/ProductDetailSheet';

// --- Recommendation status: determines CTA type ---
export type ActionStatus = 'available' | 'custom_order' | 'architectural';

// --- Intervention tier: visual weight hierarchy ---
export type InterventionTier = 'quick_win' | 'enhancement' | 'structural';
export type ImpactLevel = 'low' | 'medium' | 'high';
export type EffortLevel = 'low' | 'medium' | 'high';

// --- Tier display config ---
export interface TierDisplayConfig {
  label: string;
  labelEn: string;
  color: string;
  bg: string;
  borderColor: string;
  cardBg: string;
}

export const TIER_CONFIG: Record<InterventionTier, TierDisplayConfig> = {
  quick_win: {
    label: 'محصولات پیشنهادی',
    labelEn: 'Suggested Products',
    color: 'var(--color-tier-quickwin)',
    bg: 'var(--color-tier-quickwin-light)',
    borderColor: 'var(--color-tier-quickwin-border)',
    cardBg: 'var(--color-surface-default)',
  },
  enhancement: {
    label: 'بهبود فضا',
    labelEn: 'Enhancement',
    color: 'var(--color-tier-enhancement)',
    bg: 'var(--color-tier-enhancement-light)',
    borderColor: 'var(--color-tier-enhancement-border)',
    cardBg: 'var(--color-surface-default)',
  },
  structural: {
    label: 'تغییرات ساختاری',
    labelEn: 'Structural Upgrade',
    color: 'var(--color-tier-structural)',
    bg: 'var(--color-tier-structural-light)',
    borderColor: 'var(--color-tier-structural-border)',
    cardBg: 'var(--color-surface-default)',
  },
};

export const IMPACT_LABELS: Record<ImpactLevel, string> = { low: 'کم', medium: 'متوسط', high: 'زیاد' };
export const EFFORT_LABELS: Record<EffortLevel, string> = { low: 'کم', medium: 'متوسط', high: 'زیاد' };
export const LEVEL_BAR_WIDTHS: Record<string, string> = { low: '33%', medium: '66%', high: '100%' };

// --- Category Group type for grouped product display ---
export interface CategoryGroup {
  category: string;
  categoryDisplay: string;
  itemId: number;
  fitReasoningFa: string;
  recommendedSize: string;
  quantity: number;
  placement: string;
  problemStatement: string;
  whyChangeReasons: string[];
  designStrategy: string;
  designStrategyBenefits: string[];
  harmonyImpact: number;
  products: (Product & { store?: string; matchScore?: number })[];
  // Unified recommendation fields
  actionStatus: ActionStatus;
  interventionTier: InterventionTier;
  impactLevel: ImpactLevel;
  effortLevel: EffortLevel;
  actionType?: string;
  actionGuidance?: string;
  actionDifficulty?: string;
  actionEstimate?: string;
  // Enhancement / Structural guidance fields
  referenceImageUrl?: string;
  specNote?: string;
}

// --- Tier group type for rendering ---
export interface TierGroup {
  tier: InterventionTier;
  items: CategoryGroup[];
}

// --- Design Action helpers ---
export const ACTION_DIFFICULTY_MAP: Record<string, { label: string; icon: typeof Paintbrush; color: string; bg: string }> = {
  simple: { label: 'ساده — قابل انجام شخصی', icon: Paintbrush, color: 'var(--color-feedback-good)', bg: 'rgba(0,49,45,0.06)' },
  moderate: { label: 'متوسط — نیاز به ابزار تخصصی', icon: Wrench, color: 'var(--color-feedback-neutral)', bg: 'rgba(252,111,32,0.06)' },
  professional: { label: 'حرفه\u200Cای — نیاز به متخصص', icon: HardHat, color: 'var(--color-feedback-bad)', bg: 'rgba(93,13,2,0.06)' },
};

/**
 * Convert API matched product to UI Product format
 */
export function matchedProductToUIProduct(
  product: MatchedProduct,
  index: number
): Product & { store?: string; style?: string; isPromoted?: boolean; matchScore?: number } {
  return {
    id: String(product.id),
    name: product.name,
    price: product.price,
    category: product.categoryDisplay || product.category || 'محصول',
    store: product.shopName || 'فروشگاه هوما',
    image: product.imageUrl,
    hotspot: { x: 50, y: 50 + index * 10 },
    isPromoted: product.isPromoted,
    persianReason: product.persianReason,
    matchHighlights: product.matchHighlights,
    description: product.description,
    extraDetails: product.extraDetails,
    link: product.link,
    uniqueLink: product.uniqueLink,
    availableSizes: product.availableSizes,
    availableSizesDisplay: product.availableSizesDisplay,
    sizePrices: product.sizePrices,
    sizePricesDisplay: product.sizePricesDisplay,
    priceRange: product.priceRange,
    matchScore: product.matchScore,
  };
}

// Re-export types from studioService for convenience
export type { SessionItem, MatchedProduct };
