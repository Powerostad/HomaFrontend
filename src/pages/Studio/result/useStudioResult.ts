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
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStudio } from '@/context/StudioContext';
import { useAuth } from '@/context/AuthContext';
import { useUpload } from '@/context/AppProviders';
import { useBasket } from '@/context/BasketContext';
import { toast } from 'sonner';
import {
  prepareDownload,
  triggerDownload,
  triggerShare,
  getDownloadErrorMessage,
  type PreparedDownload,
} from '@/utils/downloadUtils';
// formatPriceFromRial available for consumers: import from '@/utils/formatters'
import {
  trackStudioResultViewed,
  trackStudioResultAction,
  trackStudioProductClicked,
} from '@/analytics/events';
import type { Product } from '../components/ProductDetailSheet';
import type { RedesignSession } from '@/services/studioService';
import { createImageCreditRequest } from '@/services/studioService';
import {
  type CategoryGroup,
  type TierGroup,
  matchedProductToUIProduct,
} from './types';
import {
  calculateRecommendedTotalPrice,
  calculateSelectedPrice,
  countSelectedProducts,
  getResultImage,
  isAnalysisOnlyResult,
} from './resultState';

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
  analysisOnly: boolean;
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
  recommendedTotalPrice: number;
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
  isFinalizing: boolean;
  handleProductClick: (product: Product) => void;
  handleImageMarkerClick: (itemId: number) => void;
  handleRequestRedesignCredit: () => Promise<void>;
  isRequestingRedesignCredit: boolean;
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
  const {
    basket,
    addItem: addToServerBasket,
    removeItem: removeFromServerBasket,
    updateQuantity: updateServerQuantity,
    openBasket,
  } = useBasket();

  // =========================================================================
  // Core State
  // =========================================================================

  const [phase, setPhase] = useState<ResultPhase>('analysis');
  const [acceptedItems, setAcceptedItems] = useState<Set<number>>(new Set());
  const [basketProductIds, setBasketProductIds] = useState<Set<string>>(new Set());
  // Mirror for reading the latest selection synchronously inside callbacks.
  const basketProductIdsRef = useRef(basketProductIds);
  basketProductIdsRef.current = basketProductIds;
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
  const [isRequestingRedesignCredit, setIsRequestingRedesignCredit] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  // Guards against double-submit — the add endpoint increments quantity, so a
  // second concurrent finalize would double-count.
  const finalizingRef = useRef(false);

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
      const wasAccepted = next.has(itemId);
      if (wasAccepted) next.delete(itemId);
      else next.add(itemId);
      trackStudioResultAction({
        action: wasAccepted ? 'recommendation_rejected' : 'recommendation_accepted',
        session_id: sessionId || activeSessionId || '',
        item_id: itemId,
      });
      return next;
    });
  }, [sessionId, activeSessionId]);

  // Local selection only — drives the studio collection/invoice summary UI.
  // The server-authoritative basket is reconciled once, at checkout
  // (handleFinalize), so we never double-count via the idempotent-increment
  // add endpoint and never push items the user hasn't committed to buying.
  const toggleBasketProduct = useCallback((productId: string) => {
    setBasketProductIds(prev => {
      const next = new Set(prev);
      const wasSelected = next.has(productId);
      if (wasSelected) next.delete(productId);
      else next.add(productId);
      trackStudioResultAction({
        action: wasSelected ? 'product_removed_local' : 'product_added_local',
        session_id: sessionId || activeSessionId || '',
        product_id: productId,
      });
      return next;
    });
  }, [sessionId, activeSessionId]);

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

  const analysisOnly = isAnalysisOnlyResult(activeSession);
  const resultImage = getResultImage(activeSession);

  // Build category groups from session items
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    if (!activeSession?.items?.length) return [];
    return activeSession.items
      .map(item => ({
        category: item.category || item.type,
        categoryDisplay: item.categoryDisplay || item.type,
        itemId: item.id,
        recommendationReasonFa: item.recommendationReasonFa || '',
        designRationaleFa: item.designRationaleFa || '',
        recommendedSize: item.recommendedSize || '',
        quantity: quantityOverrides.get(item.id) ?? item.quantity ?? 1,
        placements: item.placements || [],
        positionInImage: item.positionInImage,
        products: item.matchedProducts.map((p, i) => matchedProductToUIProduct(p, i)),
        actionStatus: item.actionStatus || (item.matchedProducts.length > 0 ? 'available' : 'custom_order'),
        interventionTier: (item.interventionTier ||
          (item.actionStatus === 'architectural'
            ? 'structural'
            : item.actionStatus === 'custom_order'
              ? 'enhancement'
              : 'quick_win')) as CategoryGroup['interventionTier'],
        impactLevel: (item.impactLevel || 'medium') as CategoryGroup['impactLevel'],
        actionType: item.actionType,
        actionGuidance: item.actionGuidance,
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
  const recommendedTotalPrice = useMemo(
    () => calculateRecommendedTotalPrice(categoryGroups),
    [categoryGroups],
  );

  // Selected price: only explicit local product selections count.
  // Recommendation acceptance remains an independent design decision.
  const selectedPrice = useMemo(
    () => calculateSelectedPrice(categoryGroups, basketProductIds, productQuantityOverrides),
    [categoryGroups, basketProductIds, productQuantityOverrides],
  );

  // Count of explicitly selected products (not accepted recommendations).
  const selectedCount = useMemo(
    () => countSelectedProducts(categoryGroups, basketProductIds),
    [categoryGroups, basketProductIds],
  );

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
    return categoryGroups.reduce((sum, g) => sum + (g.impactLevel === 'high' ? 3 : g.impactLevel === 'medium' ? 2 : 1), 0);
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
      .reduce((sum, g) => sum + (g.impactLevel === 'high' ? 3 : g.impactLevel === 'medium' ? 2 : 1), 0);
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

  // Stable ref for loadSession to avoid effect re-runs
  const loadSessionRef = useRef(loadSession);
  loadSessionRef.current = loadSession;

  // Track in-flight session loads to prevent duplicate requests
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  // Load session data if not already in context
  useEffect(() => {
    const loadSessionData = async () => {
      if (!authInitialized || !isLoggedIn) return;
      if (!sessionId) return;

      // Skip if already loaded or currently loading this session
      if (activeSession && activeSessionId === sessionId) return;
      if (loadingSessionId === sessionId) return;

      setLoadingSessionId(sessionId);
      setIsLoading(true);
      const result = await loadSessionRef.current(sessionId);
      setIsLoading(false);
      setLoadingSessionId(null);

      if (!result.success) {
        toast.error(result.error || t('errors.resultFailed', '\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0646\u062A\u06CC\u062C\u0647 \u0637\u0631\u0627\u062D\u06CC'));
      }
    };

    loadSessionData();
  }, [sessionId, authInitialized, isLoggedIn, activeSession, activeSessionId]);

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
  }, [activeSession?.id]);  

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

  // Selection is intentionally empty on first load. Recommendations and basket
  // products are previews until the user takes each action explicitly.
  useEffect(() => {
    setAcceptedItems(new Set());
    setBasketProductIds(new Set());
    setQuantityOverrides(new Map());
    setProductQuantityOverrides(new Map());
  }, [sessionId]);

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

  // =========================================================================
  // Handlers
  // =========================================================================

  // Download: Phase 1 - prepare (async fetch, no user gesture needed)
  const handleDownload = useCallback(async () => {
    const imageUrl = activeSession?.skipImageGeneration ? null : activeSession?.redesignedImageUrl;
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
  }, [activeSession?.redesignedImageUrl, activeSession?.skipImageGeneration, sessionId, activeSessionId, t]);

  const handleRequestRedesignCredit = useCallback(async () => {
    const currentSessionId = sessionId || activeSessionId;
    if (!currentSessionId) return;

    setIsRequestingRedesignCredit(true);
    trackStudioResultAction({
      action: 'redesign_credit_request_clicked',
      session_id: currentSessionId,
    });
    try {
      const result = await createImageCreditRequest({
        source: 'web',
        placement: 'no_image_result_hero',
        redesignSessionId: currentSessionId,
      });

      if (result.success) {
        toast.success('درخواست شما ثبت شده است');
      } else {
        toast.error(result.error || 'خطا در ثبت درخواست اعتبار');
      }
    } finally {
      setIsRequestingRedesignCredit(false);
    }
  }, [sessionId, activeSessionId]);

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

  // Finalize: reconcile the explicit local basket into the server basket.
  const handleFinalize = useCallback(async () => {
    if (finalizingRef.current) return;
    const currentSessionId = sessionId || activeSessionId || '';
    trackStudioResultAction({ action: 'finalize', session_id: currentSessionId });

    // Reconcile the local studio selection into the server-authoritative basket,
    // then open the BasketSheet to check out. We commit here (not on every
    // toggle) so the add endpoint — which increments quantity — is hit exactly
    // once per product, and so we never push items the user hasn't committed to.
    finalizingRef.current = true;
    setIsFinalizing(true);
    try {
      // Desired selection: unique_link -> quantity.
      const desired = new Map<string, number>();
      for (const group of categoryGroupsRef.current) {
        if (group.actionStatus !== 'available' || group.products.length === 0) continue;
        group.products.forEach((p, i) => {
          if (!basketProductIdsRef.current.has(p.id) || !p.uniqueLink) return;
          const qty = i === 0
            ? (group.quantity || 1)
            : (productQuantityOverrides.get(p.id) ?? group.quantity ?? 1);
          desired.set(p.uniqueLink, qty);
        });
      }

      // Current studio-sourced server items: unique_link -> { id, qty }.
      const serverStudioItems = new Map<string, { id: string; qty: number }>();
      for (const g of basket.shop_groups) {
        for (const it of g.items) {
          if (it.source_context === 'studio') {
            serverStudioItems.set(it.product_unique_link, { id: it.id, qty: it.quantity });
          }
        }
      }

      const ops: Promise<unknown>[] = [];
      // Add new / fix quantity for selected items.
      for (const [uniqueLink, qty] of desired) {
        const existing = serverStudioItems.get(uniqueLink);
        if (!existing) {
          ops.push(addToServerBasket({
            product_unique_link: uniqueLink,
            source_context: 'studio',
            redesign_session_id: currentSessionId || undefined,
            quantity: qty,
          }));
        } else if (existing.qty !== qty) {
          ops.push(updateServerQuantity(existing.id, qty));
        }
      }
      // Drop studio items the user deselected (leaves items from other flows).
      for (const [uniqueLink, { id }] of serverStudioItems) {
        if (!desired.has(uniqueLink)) ops.push(removeFromServerBasket(id));
      }

      await Promise.all(ops);
    } finally {
      finalizingRef.current = false;
      setIsFinalizing(false);
    }

    openBasket();
  }, [
    openBasket,
    addToServerBasket,
    removeFromServerBasket,
    updateServerQuantity,
    basket,
    sessionId,
    activeSessionId,
    productQuantityOverrides,
  ]);

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
        persianReason: product.persianReason || group?.recommendationReasonFa || group?.designRationaleFa || '',
      });
    },
    [categoryGroups, sessionId, activeSessionId]
  );

  const handleImageMarkerClick = useCallback((itemId: number) => {
    trackStudioResultAction({
      action: 'image_marker_clicked',
      session_id: sessionId || activeSessionId || '',
      item_id: itemId,
    });
    scrollToCard(itemId);
    window.setTimeout(() => {
      document.getElementById(`recommendation-${itemId}`)?.focus({ preventScroll: true });
    }, 180);
  }, [sessionId, activeSessionId, scrollToCard]);

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

  // Project name and target style are session-level metadata used by the result page.
  const projectName = activeSession?.roomType || '';
  const targetStyle = activeSession?.preferredStyle || '';
  const isDownloading = downloadState === 'preparing';

  // Priority ranking: items sorted by harmony impact (highest first)
  const priorityRankedIds = useMemo(() => {
    return [...categoryGroups]
      .sort((a, b) => {
        const score = (g: typeof a) => (g.impactLevel === 'high' ? 3 : g.impactLevel === 'medium' ? 2 : 1);
        return score(b) - score(a);
      })
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
    analysisOnly,
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
    recommendedTotalPrice,
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
    isFinalizing,
    handleProductClick,
    handleImageMarkerClick,
    handleRequestRedesignCredit,
    isRequestingRedesignCredit,
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
