/**
 * Types, constants and helpers for Studio Result Page
 */
import {
  Paintbrush,
  Wrench,
  HardHat,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../components/ProductDetailSheet';

// --- i18n wrapper (compatible with friend's useSimpleTranslation API) ---
export function useSimpleTranslation() {
  const { t: translate } = useTranslation();
  return {
    t: (key: string, fallback: string, params?: Record<string, any>) => {
      if (!params) return translate(key, fallback);
      let result = translate(key, fallback) as string;
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{{${k}}}`, String(v));
      });
      return result;
    }
  };
}

// --- Analytics stubs ---
export function trackStudioResultViewed(_data: Record<string, any>) { /* no-op */ }
export function trackStudioResultAction(_data: Record<string, any>) { /* no-op */ }
export function trackStudioProductClicked(_data: Record<string, any>) { /* no-op */ }

// --- MatchedProduct type (mirrors API shape) ---
export interface MatchedProduct {
  id: number;
  name: string;
  price: number;
  category?: string;
  categoryDisplay?: string;
  shopName?: string;
  imageUrl: string;
  isPromoted?: boolean;
  persianReason?: string;
  matchHighlights?: string[];
  description?: string;
  extraDetails?: Record<string, unknown>;
  link?: string;
  uniqueLink?: string;
  availableSizes?: string[];
  availableSizesDisplay?: string[];
  sizePrices?: Record<string, number> | null;
  sizePricesDisplay?: Array<{
    code: string;
    display: string;
    price: number | null;
    hasSpecificPrice: boolean;
  }>;
  priceRange?: { min: number; max: number } | null;
  matchScore?: number;
}

// --- Recommendation status ---
export type ActionStatus = 'available' | 'custom_order' | 'architectural';

// --- Intervention tier ---
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
    color: 'var(--feedback-good)',
    bg: 'rgba(0,49,45,0.04)',
    borderColor: 'rgba(0,49,45,0.15)',
    cardBg: 'var(--card)',
  },
  enhancement: {
    label: 'بهبود فضا',
    labelEn: 'Enhancement',
    color: 'var(--feedback-neutral)',
    bg: 'rgba(252,111,32,0.04)',
    borderColor: 'rgba(252,111,32,0.20)',
    cardBg: 'var(--card)',
  },
  structural: {
    label: 'تغییرات ساختاری',
    labelEn: 'Structural Upgrade',
    color: 'var(--tier-structural)',
    bg: 'var(--tier-structural-light)',
    borderColor: 'var(--tier-structural-border)',
    cardBg: 'var(--card)',
  },
};

export const IMPACT_LABELS: Record<ImpactLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };
export const EFFORT_LABELS: Record<EffortLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };
export const LEVEL_BAR_WIDTHS: Record<string, string> = { low: '33%', medium: '66%', high: '100%' };

// --- Category Group type ---
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
  actionStatus: ActionStatus;
  interventionTier: InterventionTier;
  impactLevel: ImpactLevel;
  effortLevel: EffortLevel;
  actionType?: string;
  actionGuidance?: string;
  actionDifficulty?: 'simple' | 'moderate' | 'professional';
  actionCategory?: string;
  actionEstimate?: string;
  referenceImageUrl?: string;
  actionSteps?: string[];
  specNote?: string;
}

// --- Session type ---
export interface ResultSession {
  id: string;
  redesignedImageUrl?: string;
  roomImageUrl?: string;
  projectName?: string;
  targetStyle?: string;
  harmonyScore?: number;
  improvementPoints?: string[];
  diagnosisDetail?: string;
  items: {
    id: number;
    category?: string;
    type: string;
    categoryDisplay?: string;
    fitReasoningFa?: string;
    recommendedSize?: string;
    quantity?: number;
    placement?: string;
    tryonStatus?: string;
    problemStatement?: string;
    whyChangeReasons?: string[];
    designStrategy?: string;
    designStrategyBenefits?: string[];
    harmonyImpact?: number;
    matchedProducts: MatchedProduct[];
    actionStatus?: ActionStatus;
    actionType?: string;
    interventionTier?: InterventionTier;
    impactLevel?: ImpactLevel;
    effortLevel?: EffortLevel;
    actionGuidance?: string;
    actionDifficulty?: 'simple' | 'moderate' | 'professional';
    actionCategory?: string;
    actionEstimate?: string;
    referenceImageUrl?: string;
    actionSteps?: string[];
    specNote?: string;
  }[];
}

// --- Design Action helpers ---
export const ACTION_DIFFICULTY_MAP: Record<string, { label: string; icon: typeof Paintbrush; color: string; bg: string }> = {
  simple: { label: 'ساده — قابل انجام شخصی', icon: Paintbrush, color: 'var(--feedback-good)', bg: 'rgba(0,49,45,0.06)' },
  moderate: { label: 'متوسط — نیاز به ابزار تخصصی', icon: Wrench, color: 'var(--feedback-neutral)', bg: 'rgba(252,111,32,0.06)' },
  professional: { label: 'حرفه‌ای — نیاز به متخصص', icon: HardHat, color: 'var(--feedback-bad)', bg: 'rgba(93,13,2,0.06)' },
};

/**
 * Convert API matched product to UI Product format
 */
/**
 * Returns the effective price for a product, using the size-specific price if a size is selected.
 */
export function getEffectivePrice(
  product: { price: number; sizePrices?: Record<string, number> | null },
  selectedSize?: string | null
): number {
  if (selectedSize && product.sizePrices && product.sizePrices[selectedSize] != null) {
    return product.sizePrices[selectedSize];
  }
  return product.price;
}

export function matchedProductToUIProduct(product: MatchedProduct, index: number): Product & { store?: string; style?: string; isPromoted?: boolean; matchScore?: number } {
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

// --- Tier group ---
export interface TierGroup {
  tier: InterventionTier;
  items: CategoryGroup[];
}

// --- Completion Checklist ---
export interface CompletionChecklistItem {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  aiReasoning: string;
  webSearchQuery?: string;
}
