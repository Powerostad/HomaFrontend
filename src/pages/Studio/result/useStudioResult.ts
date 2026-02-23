/**
 * useStudioResult - Central state management hook for the Studio Result Page
 *
 * Manages all state, computed values, and handlers needed by the editorial
 * result page and its child components. Integrates with real production APIs
 * via useStudio() and useAuth() contexts.
 *
 * Phases:
 *   'analysis'        - User reviews AI diagnosis and item recommendations
 *   'recommendations' - User selects/rejects items and browses products
 *   'basket'          - Final shopping list review before finalization
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudio } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { useUpload } from '@/context/AppProviders';
import { toast } from 'sonner';
import {
  prepareDownload,
  triggerDownload,
  triggerShare,
  getDownloadErrorMessage,
  type PreparedDownload,
} from '@/utils/downloadUtils';
// formatPriceFromRial available for consumers: import from '@/utils/formatters'
import { apiPost, apiConfig } from '@/utils/apiClient';
import {
  trackStudioResultViewed,
  trackStudioResultAction,
  trackStudioProductClicked,
} from '@/analytics/events';
import type { Product } from '../components/ProductDetailSheet';
import type { RedesignSession } from '@/services/studioService';
import {
  type CategoryGroup,
  type TierGroup,
  matchedProductToUIProduct,
} from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResultPhase = 'analysis' | 'recommendations' | 'basket';
export type DownloadState = 'idle' | 'preparing' | 'ready';

export interface UseStudioResultReturn {
  // Navigation
  navigate: ReturnType<typeof useNavigate>;
  sessionId: string | undefined;
  activeSessionId: string | null;
  t: ReturnType<typeof useTranslation>['t'];

  // Phase
  phase: ResultPhase;
  setPhase: (phase: ResultPhase) => void;
  goToAnalysis: () => void;
  goToRecommendations: () => void;
  goToBasket: () => void;

  // Session & images
  activeSession: RedesignSession | null;
  resultImage: string;
  originalImage: string | null;
  showOriginal: boolean;
  setShowOriginal: (show: boolean) => void;

  // UI state
  isLoading: boolean;
  isInitialized: boolean;
  isFullScreen: boolean;
  setIsFullScreen: (fs: boolean) => void;
  isSaved: boolean;
  setIsSaved: (saved: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  showExitDecision: boolean;
  setShowExitDecision: (show: boolean) => void;
  diagnosisExpanded: boolean;
  setDiagnosisExpanded: (expanded: boolean) => void;
  downloadState: DownloadState;
  showDownloadReady: boolean;

  // Product state
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  productAlternatives: Product[];

  // Item accept/reject
  acceptedItems: Set<number>;
  toggleAcceptedItem: (itemId: number) => void;
  acceptAllItems: () => void;
  rejectAllItems: () => void;

  // Basket product selection
  basketProductIds: Set<string>;
  toggleBasketProduct: (productId: string) => void;

  // Quantity controls
  quantityOverrides: Map<number, number>;
  updateItemQuantity: (itemId: number, newQuantity: number) => void;
  productQuantityOverrides: Map<string, number>;
  updateProductQuantity: (productId: string, newQuantity: number) => void;

  // Completion checklist
  checklistCheckedIds: Set<number>;
  toggleChecklistItem: (itemId: number) => void;
  completionChecklistItems: CategoryGroup[];

  // Card UI state
  expandedGroups: Set<number>;
  expandedWhyGroups: Set<number>;
  collapsedCards: Set<number>;
  toggleGroupExpanded: (itemId: number) => void;
  toggleWhyExpanded: (itemId: number) => void;
  toggleCardCollapsed: (itemId: number) => void;
  scrollToCard: (itemId: number) => void;

  // Computed data
  categoryGroups: CategoryGroup[];
  tierGroups: TierGroup[];
  displayProducts: Product[];
  totalPrice: number;
  selectedPrice: number;
  selectedCount: number;
  harmonyScore: number;
  projectedScore: number;
  liveProjectedScore: number;
  totalHarmonyImpact: number;
  acceptedHarmonyImpact: number;
  harmonyLabel: string;
  improvementPoints: string[];
  diagnosisDetail: string;

  // Handlers
  handleDownload: () => Promise<void>;
  handleConfirmDownload: () => Promise<void>;
  handleCancelDownload: () => void;
  handleFinalize: () => void;
  handleProductClick: (product: Product) => void;
  handleExit: () => void;
  getActiveProduct: (group: CategoryGroup) => Product | null;

  // Derived session metadata
  projectName: string;
  targetStyle: string;
  isDownloading: boolean;
  priorityRankedIds: number[];

  // Auth
  isLoggedIn: boolean;
  login: (user: any, tokens: any) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStudioResult(): UseStudioResultReturn {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Route param is named "jobId" in App.tsx, but we use "sessionId" internally
  const { jobId: sessionId } = useParams<{ jobId: string }>();

  // Context hooks
  const { isLoggedIn, isInitialized: authInitialized, login } = useAuth();
  const {
    activeSession,
    activeSessionId,
    loadSession,
    clearActiveSession,
  } = useStudio();
  const { selectedFile } = useUpload();

  // =========================================================================
  // Core State
  // =========================================================================

  const [phase, setPhase] = useState<ResultPhase>('analysis');
  const [acceptedItems, setAcceptedItems] = useState<Set<number>>(new Set());
  const [basketProductIds, setBasketProductIds] = useState<Set<string>>(new Set());
  const [quantityOverrides, setQuantityOverrides] = useState<Map<number, number>>(new Map());
  const [productQuantityOverrides, setProductQuantityOverrides] = useState<Map<string, number>>(new Map());
  const [checklistCheckedIds, setChecklistCheckedIds] = useState<Set<number>>(new Set());

  // =========================================================================
  // UI State
  // =========================================================================

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [diagnosisExpanded, setDiagnosisExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [preparedDownloadData, setPreparedDownloadData] = useState<PreparedDownload | null>(null);
  const [showDownloadReady, setShowDownloadReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showExitDecision, setShowExitDecision] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [topPickUrls, setTopPickUrls] = useState<Record<string, string>>({});

  // Card-level UI toggle state
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [expandedWhyGroups, setExpandedWhyGroups] = useState<Set<number>>(new Set());
  const [collapsedCards, setCollapsedCards] = useState<Set<number>>(new Set());

  // =========================================================================
  // Phase Navigation
  // =========================================================================

  const goToAnalysis = useCallback(() => setPhase('analysis'), []);
  const goToRecommendations = useCallback(() => setPhase('recommendations'), []);
  const goToBasket = useCallback(() => setPhase('basket'), []);

  // =========================================================================
  // Toggle Helpers
  // =========================================================================

  const toggleGroupExpanded = useCallback((itemId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const toggleWhyExpanded = useCallback((itemId: number) => {
    setExpandedWhyGroups(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const toggleCardCollapsed = useCallback((itemId: number) => {
    setCollapsedCards(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const toggleAcceptedItem = useCallback((itemId: number) => {
    setAcceptedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const toggleBasketProduct = useCallback((productId: string) => {
    setBasketProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const toggleChecklistItem = useCallback((itemId: number) => {
    setChecklistCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  // =========================================================================
  // Quantity Controls
  // =========================================================================

  const updateItemQuantity = useCallback((itemId: number, newQuantity: number) => {
    const clamped = Math.max(1, Math.min(99, newQuantity));
    setQuantityOverrides(prev => {
      const next = new Map(prev);
      next.set(itemId, clamped);
      return next;
    });
  }, []);

  const updateProductQuantity = useCallback((productId: string, newQuantity: number) => {
    const clamped = Math.max(1, Math.min(99, newQuantity));
    setProductQuantityOverrides(prev => {
      const next = new Map(prev);
      next.set(productId, clamped);
      return next;
    });
  }, []);

  // =========================================================================
  // Bulk Accept / Reject
  // =========================================================================

  const acceptAllItems = useCallback(() => {
    setAcceptedItems(prev => {
      const ids = categoryGroupsRef.current
        .filter(g => g.actionStatus === 'available' && g.products.length > 0)
        .map(g => g.itemId);
      return new Set([...prev, ...ids]);
    });
  }, []);

  const rejectAllItems = useCallback(() => {
    setAcceptedItems(new Set());
  }, []);

  // =========================================================================
  // Scroll-to-card helper
  // =========================================================================

  const scrollToCard = useCallback((itemId: number) => {
    // Ensure card is uncollapsed and expanded
    setCollapsedCards(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    setTimeout(() => {
      const el = document.getElementById(`recommendation-${itemId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  // =========================================================================
  // Get active (main) product for a group
  // =========================================================================

  const getActiveProduct = useCallback((group: CategoryGroup): Product | null => {
    return group.products[0] || null;
  }, []);

  // =========================================================================
  // Computed Values
  // =========================================================================

  const resultImage = activeSession?.redesignedImageUrl ?? '';

  // Build category groups from session items
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    if (!activeSession?.items?.length) return [];
    return activeSession.items
      .map(item => ({
        category: item.category || item.type,
        categoryDisplay: item.categoryDisplay || item.type,
        itemId: item.id,
        fitReasoningFa: item.fitReasoningFa || '',
        recommendedSize: item.recommendedSize || '',
        quantity: quantityOverrides.get(item.id) ?? item.quantity ?? 1,
        placement: item.placement || '',
        problemStatement: item.problemStatement || '',
        whyChangeReasons: item.whyChangeReasons || [],
        designStrategy: item.designStrategy || '',
        designStrategyBenefits: item.designStrategyBenefits || [],
        harmonyImpact: item.harmonyImpact ?? 0,
        products: item.matchedProducts.map((p, i) => matchedProductToUIProduct(p, i)),
        actionStatus: item.actionStatus || (item.matchedProducts.length > 0 ? 'available' : 'custom_order'),
        interventionTier: (item.interventionTier ||
          (item.actionStatus === 'architectural'
            ? 'structural'
            : item.actionStatus === 'custom_order'
              ? 'enhancement'
              : 'quick_win')) as CategoryGroup['interventionTier'],
        impactLevel: (item.impactLevel || 'medium') as CategoryGroup['impactLevel'],
        effortLevel: (item.effortLevel || 'medium') as CategoryGroup['effortLevel'],
        actionType: item.actionType,
        actionGuidance: item.actionGuidance,
        actionDifficulty: item.actionDifficulty as CategoryGroup['actionDifficulty'],
        actionEstimate: item.actionEstimate,
        referenceImageUrl: item.referenceImageUrl,
        specNote: item.specNote,
      }));
  }, [activeSession, quantityOverrides]);

  // Keep a ref for use in callbacks that should not trigger re-renders
  // when categoryGroups change (e.g. acceptAllItems)
  const categoryGroupsRef = { current: categoryGroups };
  categoryGroupsRef.current = categoryGroups;

  // Tier-grouped items (ordered: quick_win -> enhancement -> structural)
  const tierGroups = useMemo<TierGroup[]>(() => {
    const tiers: TierGroup[] = [
      { tier: 'quick_win', items: [] },
      { tier: 'enhancement', items: [] },
      { tier: 'structural', items: [] },
    ];
    for (const g of categoryGroups) {
      const bucket = tiers.find(tg => tg.tier === g.interventionTier);
      if (bucket) bucket.items.push(g);
    }
    return tiers.filter(tg => tg.items.length > 0);
  }, [categoryGroups]);

  // Completion checklist: items with NO matched products (non-purchasable actions)
  // Derived from categoryGroups to avoid duplicating mapping logic
  const completionChecklistItems = useMemo<CategoryGroup[]>(() => {
    return categoryGroups.filter(g => g.products.length === 0);
  }, [categoryGroups]);

  // Flat product list (backward compat for context bar, etc.)
  const displayProducts = useMemo(() => {
    return categoryGroups.flatMap(g => g.products);
  }, [categoryGroups]);

  // Total price: sum of main (AI pick) products * quantity for purchasable categories
  const totalPrice = useMemo(() => {
    return categoryGroups
      .filter(g => g.actionStatus === 'available' && g.products.length > 0)
      .reduce((acc, group) => {
        const mainProduct = group.products[0];
        const qty = group.quantity || 1;
        return acc + (mainProduct?.price || 0) * qty;
      }, 0);
  }, [categoryGroups]);

  // Selected price: basket-aware calculation
  // Main products use group qty, alternatives use per-product qty
  const selectedPrice = useMemo(() => {
    let total = 0;
    for (const group of categoryGroups) {
      if (group.actionStatus !== 'available' || group.products.length === 0) continue;
      if (!acceptedItems.has(group.itemId)) continue;
      for (let i = 0; i < group.products.length; i++) {
        const product = group.products[i];
        if (!basketProductIds.has(product.id)) continue;
        const isMain = i === 0;
        const qty = isMain
          ? (group.quantity || 1)
          : (productQuantityOverrides.get(product.id) ?? group.quantity ?? 1);
        total += (product.price || 0) * qty;
      }
    }
    return total;
  }, [categoryGroups, acceptedItems, basketProductIds, productQuantityOverrides]);

  // Count of accepted item categories
  const selectedCount = useMemo(() => {
    return categoryGroups
      .filter(g => g.actionStatus === 'available' && g.products.length > 0 && acceptedItems.has(g.itemId))
      .length;
  }, [categoryGroups, acceptedItems]);

  // Harmony score from diagnosis or fallback from match scores
  const harmonyScore = useMemo(() => {
    if (activeSession?.diagnosis?.harmonyScore != null) {
      return activeSession.diagnosis.harmonyScore;
    }
    const scores = categoryGroups
      .map(g => g.products[0]?.matchScore)
      .filter((s): s is number => s != null);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [activeSession?.diagnosis?.harmonyScore, categoryGroups]);

  // Total harmony impact across all category groups
  const totalHarmonyImpact = useMemo(() => {
    return categoryGroups.reduce((sum, g) => sum + g.harmonyImpact, 0);
  }, [categoryGroups]);

  // Projected score if all items are applied (diminishing returns model)
  const projectedScore = useMemo(() => {
    const remaining = 100 - harmonyScore;
    const gain = remaining * (1 - Math.pow(0.95, totalHarmonyImpact));
    return Math.min(99, Math.round(harmonyScore + gain));
  }, [harmonyScore, totalHarmonyImpact]);

  // Live projected score based on accepted items only
  const acceptedHarmonyImpact = useMemo(() => {
    return categoryGroups
      .filter(g => acceptedItems.has(g.itemId))
      .reduce((sum, g) => sum + g.harmonyImpact, 0);
  }, [categoryGroups, acceptedItems]);

  const liveProjectedScore = useMemo(() => {
    const remaining = 100 - harmonyScore;
    const gain = remaining * (1 - Math.pow(0.95, acceptedHarmonyImpact));
    return Math.min(99, Math.round(harmonyScore + gain));
  }, [harmonyScore, acceptedHarmonyImpact]);

  // Harmony label
  const harmonyLabel = useMemo(() => {
    if (harmonyScore >= 80) return 'Good';
    if (harmonyScore >= 50) return 'Fair';
    return 'Low';
  }, [harmonyScore]);

  // Improvement points & diagnosis detail from session
  const improvementPoints = useMemo(() => {
    return activeSession?.diagnosis?.improvementPoints || [];
  }, [activeSession?.diagnosis?.improvementPoints]);

  const diagnosisDetail = useMemo(() => {
    return activeSession?.diagnosis?.diagnosisDetail || '';
  }, [activeSession?.diagnosis?.diagnosisDetail]);

  // Alternatives scoped to the same category group as selected product
  const productAlternatives = useMemo(() => {
    if (!selectedProduct || !categoryGroups.length) return [];
    for (const group of categoryGroups) {
      if (group.products.find(p => p.id === selectedProduct.id)) {
        return group.products.filter(p => p.id !== selectedProduct.id);
      }
    }
    return [];
  }, [selectedProduct, categoryGroups]);

  // =========================================================================
  // Effects
  // =========================================================================

  // Load session data if not already in context
  useEffect(() => {
    const loadSessionData = async () => {
      if (!authInitialized) return;
      if (!isLoggedIn) return;

      // If we have a sessionId from URL but no active session (or different session)
      if (sessionId && (!activeSession || activeSessionId !== sessionId)) {
        setIsLoading(true);
        const result = await loadSession(sessionId);
        setIsLoading(false);

        if (!result.success) {
          toast.error(result.error || t('errors.resultFailed', '\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0646\u062A\u06CC\u062C\u0647 \u0637\u0631\u0627\u062D\u06CC'));
        }
      }
    };

    loadSessionData();
  }, [sessionId, activeSession, activeSessionId, loadSession, authInitialized, isLoggedIn, t]);

  // Track result page view once session data is available
  useEffect(() => {
    if (!activeSession || !sessionId) return;
    const currentSessionId = sessionId || activeSessionId;
    if (!currentSessionId) return;

    trackStudioResultViewed({
      session_id: currentSessionId,
      product_count: displayProducts.length,
      category_count: categoryGroups.length,
    });
  }, [activeSession?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth check: show modal if not logged in after auth initialization
  useEffect(() => {
    if (!authInitialized) return;

    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      setIsFullScreen(false);
    } else {
      setIsAuthModalOpen(false);
    }
  }, [isLoggedIn, authInitialized]);

  // Auto-accept all purchasable items and add main products to basket on first load
  useEffect(() => {
    if (categoryGroups.length === 0) return;

    setAcceptedItems(prev => {
      if (prev.size > 0) return prev;
      const purchasableIds = categoryGroups
        .filter(g => g.actionStatus === 'available' && g.products.length > 0)
        .map(g => g.itemId);
      return purchasableIds.length > 0 ? new Set(purchasableIds) : prev;
    });

    setBasketProductIds(prev => {
      if (prev.size > 0) return prev;
      const mainProductIds = categoryGroups
        .filter(g => g.actionStatus === 'available' && g.products.length > 0)
        .map(g => g.products[0]?.id)
        .filter((id): id is string => !!id);
      return mainProductIds.length > 0 ? new Set(mainProductIds) : prev;
    });
  }, [categoryGroups]);

  // Load original image from upload or session
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setOriginalImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (activeSession?.roomImageUrl) {
      setOriginalImage(activeSession.roomImageUrl);
    }
  }, [selectedFile, activeSession?.roomImageUrl]);

  // Pre-fetch tracking URLs for top pick products
  useEffect(() => {
    if (categoryGroups.length === 0) return;

    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      const currentSessionId = activeSessionId || sessionId || '';

      await Promise.all(
        categoryGroups.map(async (group) => {
          const topPick = group.products[0];
          if (!topPick?.uniqueLink) return;

          try {
            const response = await apiPost<{
              click_id: string | null;
              tracking_url: string | null;
            }>('/tracking/clicks/', {
              product_id: topPick.uniqueLink,
              source_context: 'studio',
              redesign_session_id: currentSessionId || null,
            });

            if (response.success && response.data?.click_id) {
              urls[topPick.id] = `${apiConfig.baseURL}/tracking/go/${response.data.click_id}/`;
            }
          } catch {
            // Will fall back to product.link in handleFinalize
          }
        })
      );

      setTopPickUrls(urls);
    };

    fetchUrls();
  }, [categoryGroups, sessionId, activeSessionId]);

  // =========================================================================
  // Handlers
  // =========================================================================

  // Download: Phase 1 - prepare (async fetch, no user gesture needed)
  const handleDownload = useCallback(async () => {
    const imageUrl = activeSession?.redesignedImageUrl;
    if (!imageUrl) {
      toast.error(t('studio.result.noImageDownload', '\u062A\u0635\u0648\u06CC\u0631\u06CC \u0628\u0631\u0627\u06CC \u062F\u0627\u0646\u0644\u0648\u062F \u0645\u0648\u062C\u0648\u062F \u0646\u06CC\u0633\u062A'));
      return;
    }

    const currentSessionId = sessionId || activeSessionId || '';
    trackStudioResultAction({ action: 'download', session_id: currentSessionId });
    setDownloadState('preparing');

    const result = await prepareDownload({
      imageUrl,
      filename: `\u0647\u0645\u0627-\u0627\u0633\u062A\u0648\u062F\u06CC\u0648-${Date.now()}`,
      useAuth: true,
    });

    if (result.success) {
      setPreparedDownloadData(result.data);
      setDownloadState('ready');
      setShowDownloadReady(true);
    } else {
      setDownloadState('idle');
      toast.error(getDownloadErrorMessage(result.error));
    }
  }, [activeSession?.redesignedImageUrl, sessionId, activeSessionId, t]);

  // Download: Phase 2 - trigger with fresh user gesture
  const handleConfirmDownload = useCallback(async () => {
    if (!preparedDownloadData) return;

    const shared = await triggerShare(preparedDownloadData);
    if (shared) {
      toast.success(t('studio.result.shareReady', '\u062A\u0635\u0648\u06CC\u0631 \u0622\u0645\u0627\u062F\u0647 \u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC \u0634\u062F'));
    } else {
      triggerDownload(preparedDownloadData);
      toast.success(t('studio.result.downloaded', '\u062A\u0635\u0648\u06CC\u0631 \u062F\u0627\u0646\u0644\u0648\u062F \u0634\u062F'));
    }

    setPreparedDownloadData(null);
    setDownloadState('idle');
    setShowDownloadReady(false);
  }, [preparedDownloadData, t]);

  // Cancel download
  const handleCancelDownload = useCallback(() => {
    if (preparedDownloadData) {
      preparedDownloadData.cleanup();
    }
    setPreparedDownloadData(null);
    setDownloadState('idle');
    setShowDownloadReady(false);
  }, [preparedDownloadData]);

  // Finalize: open product pages for all accepted items with basket products
  const handleFinalize = useCallback(() => {
    const currentSessionId = sessionId || activeSessionId || '';
    trackStudioResultAction({ action: 'finalize', session_id: currentSessionId });

    categoryGroups
      .filter(g => g.actionStatus === 'available' && g.products.length > 0)
      .forEach(group => {
        // Open the main product or first basket product for this group
        const mainProd = group.products[0];
        if (!mainProd) return;
        const url = topPickUrls[mainProd.id] || mainProd.link;
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      });
  }, [categoryGroups, topPickUrls, sessionId, activeSessionId]);

  // Product click: enrich with category-level AI reasoning
  const handleProductClick = useCallback(
    (product: Product) => {
      const group = categoryGroups.find(g =>
        g.products.some(p => p.id === product.id)
      );
      const isTopPick = group ? group.products[0]?.id === product.id : false;
      const currentSessionId = sessionId || activeSessionId || '';

      trackStudioProductClicked({
        session_id: currentSessionId,
        product_id: product.id,
        product_name: product.name,
        category: product.category || '',
        is_top_pick: isTopPick,
      });

      setSelectedProduct({
        ...product,
        persianReason: product.persianReason || group?.fitReasoningFa || '',
      });
    },
    [categoryGroups, sessionId, activeSessionId]
  );

  // Exit handler: save & navigate back to studio
  const handleExit = useCallback(() => {
    setIsSaved(true);
    setShowExitDecision(false);
    clearActiveSession();
    navigate('/studio');
  }, [clearActiveSession, navigate]);

  // =========================================================================
  // Derived Session Metadata
  // =========================================================================

  // Project name and target style — will be populated when AI prompt is updated
  // to include room metadata in the session-level diagnosis
  const projectName = activeSession?.roomType || '';
  const targetStyle = activeSession?.preferredStyle || '';
  const isDownloading = downloadState === 'preparing';

  // Priority ranking: items sorted by harmony impact (highest first)
  const priorityRankedIds = useMemo(() => {
    return [...categoryGroups]
      .sort((a, b) => b.harmonyImpact - a.harmonyImpact)
      .map(g => g.itemId);
  }, [categoryGroups]);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // Navigation
    navigate,
    sessionId,
    activeSessionId,
    t,

    // Phase
    phase,
    setPhase,
    goToAnalysis,
    goToRecommendations,
    goToBasket,

    // Session & images
    activeSession,
    resultImage,
    originalImage,
    showOriginal,
    setShowOriginal,

    // UI state
    isLoading,
    isInitialized: authInitialized,
    isFullScreen,
    setIsFullScreen,
    isSaved,
    setIsSaved,
    isAuthModalOpen,
    setIsAuthModalOpen,
    showExitDecision,
    setShowExitDecision,
    diagnosisExpanded,
    setDiagnosisExpanded,
    downloadState,
    showDownloadReady,

    // Product state
    selectedProduct,
    setSelectedProduct,
    productAlternatives,

    // Item accept/reject
    acceptedItems,
    toggleAcceptedItem,
    acceptAllItems,
    rejectAllItems,

    // Basket product selection
    basketProductIds,
    toggleBasketProduct,

    // Quantity controls
    quantityOverrides,
    updateItemQuantity,
    productQuantityOverrides,
    updateProductQuantity,

    // Completion checklist
    checklistCheckedIds,
    toggleChecklistItem,
    completionChecklistItems,

    // Card UI state
    expandedGroups,
    expandedWhyGroups,
    collapsedCards,
    toggleGroupExpanded,
    toggleWhyExpanded,
    toggleCardCollapsed,
    scrollToCard,

    // Computed data
    categoryGroups,
    tierGroups,
    displayProducts,
    totalPrice,
    selectedPrice,
    selectedCount,
    harmonyScore,
    projectedScore,
    liveProjectedScore,
    totalHarmonyImpact,
    acceptedHarmonyImpact,
    harmonyLabel,
    improvementPoints,
    diagnosisDetail,

    // Handlers
    handleDownload,
    handleConfirmDownload,
    handleCancelDownload,
    handleFinalize,
    handleProductClick,
    handleExit,
    getActiveProduct,

    // Derived session metadata
    projectName,
    targetStyle,
    isDownloading,
    priorityRankedIds,

    // Auth
    isLoggedIn,
    login,
  };
}
