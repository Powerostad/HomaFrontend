import { useBasket } from '@/context/BasketContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../Studio/components/ProductDetailSheet';
import type { TierGroup } from '../../Studio/result/types';
import type { StudioResultViewState } from '../../Studio/result/viewState';
import { useImageActions } from '../components/workspace';
import type { ExecutionPlan } from '../services/redesignChatService';
import { toStudioCategoryGroups } from '../services/studioResultAdapter';

interface Selection {
  accepted: number[];
  products: string[];
  quantities: Record<number, number>;
  productQuantities: Record<string, number>;
  checklist: number[];
}
const emptySelection = (): Selection => ({ accepted: [], products: [], quantities: {}, productQuantities: {}, checklist: [] });
function restoreSelection(key: string): Selection {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as Partial<Selection> | null;
    if (!value || !Array.isArray(value.accepted) || !Array.isArray(value.products)) return emptySelection();
    return { accepted: value.accepted.filter(Number.isInteger), products: value.products.filter(id => typeof id === 'string'),
      quantities: value.quantities || {}, productQuantities: value.productQuantities || {}, checklist: Array.isArray(value.checklist) ? value.checklist.filter(Number.isInteger) : [] };
  } catch { return emptySelection(); }
}
function toggle<T>(items: T[], value: T) { return items.includes(value) ? items.filter(item => item !== value) : [...items, value]; }
function quantity(value: number) { return Number.isFinite(value) ? Math.max(1, Math.min(99, Math.round(value))) : 1; }

export function useConversationStudioResult({ plan, sessionId, versionId, resultImage, originalImage, showOriginal, onToggleOriginal, onOpenChat }: {
  plan: ExecutionPlan | null; sessionId: string | null; versionId: string; resultImage: string; originalImage: string | null;
  showOriginal: boolean; onToggleOriginal: (show: boolean) => void; onOpenChat: () => void;
}): StudioResultViewState {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const basket = useBasket();
  const storageKey = `homa.studio.selection:${sessionId || 'new'}:${versionId}`;
  const [selection, setSelection] = useState(() => restoreSelection(storageKey));
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaved, setIsSaved] = useState(!!sessionId);
  const [showExitDecision, setShowExitDecision] = useState(false);
  const [diagnosisExpanded, setDiagnosisExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedWhyGroups, setExpandedWhyGroups] = useState<Set<number>>(new Set());
  const [isFinalizing, setIsFinalizing] = useState(false);
  const finalizing = useRef(false);
  const baseGroups = useMemo(() => toStudioCategoryGroups(plan), [plan]);
  const categoryGroups = useMemo(() => baseGroups.map(group => ({ ...group, quantity: quantity(selection.quantities[group.itemId] ?? group.quantity) })), [baseGroups, selection.quantities]);
  const tierGroups = useMemo<TierGroup[]>(() => (['quick_win', 'enhancement', 'structural'] as const)
    .map(tier => ({ tier, items: categoryGroups.filter(group => group.interventionTier === tier) })).filter(group => group.items.length), [categoryGroups]);
  const validIds = new Set(categoryGroups.map(group => group.itemId));
  const acceptedItems = new Set(selection.accepted.filter(id => validIds.has(id)));
  const products = categoryGroups.flatMap(group => group.products);
  const basketProductIds = new Set(selection.products.filter(id => products.some(product => product.id === id && product.uniqueLink)));
  const selectedLines = categoryGroups.flatMap(group => group.products.flatMap((product, index) => basketProductIds.has(product.id)
    ? [{ product, quantity: index === 0 ? group.quantity : quantity(selection.productQuantities[product.id] ?? group.quantity) }] : []));
  const selectedPrice = selectedLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const imageActions = useImageActions({ image: showOriginal ? originalImage : resultImage, originalImage, activeVersion: 1, isPreview: !showOriginal });
  const productAlternatives = selectedProduct ? categoryGroups.find(group => group.products.some(product => product.id === selectedProduct.id))?.products.filter(product => product.id !== selectedProduct.id) || [] : [];
  const summaries = Object.values(plan?.studio_documents || {}).map(document => document.user_facing_summary);
  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Selection still works without storage. */ } }, [selection, storageKey]);
  const scrollToCard = useCallback((id: number) => {
    const card = document.getElementById(`recommendation-${id}`);
    card?.scrollIntoView({ block: 'start', behavior: 'instant' });
    card?.focus({ preventScroll: true });
  }, []);
  const handleFinalize = async () => {
    if (finalizing.current || !selectedLines.length) return;
    finalizing.current = true;
    setIsFinalizing(true);
    try {
      const desired = new Map<string, number>();
      for (const { product, quantity: count } of selectedLines) if (product.uniqueLink) desired.set(product.uniqueLink, (desired.get(product.uniqueLink) || 0) + count);
      for (const [link, count] of desired) {
        const existing = basket.basket.shop_groups.flatMap(group => group.items).find(item => item.product_unique_link === link);
        if (existing) {
          if (existing.quantity < count) await basket.updateQuantity(existing.id, count);
        } else if (!await basket.addItem({ product_unique_link: link, source_context: 'studio', quantity: count })) return;
      }
      basket.openBasket();
    } finally { finalizing.current = false; setIsFinalizing(false); }
  };
  return {
    navigate, sessionId: sessionId || undefined, activeSessionId: null, categoryGroups, tierGroups,
    resultImage, originalImage, showOriginal, setShowOriginal: onToggleOriginal, analysisOnly: !resultImage || resultImage === originalImage,
    isFullScreen, setIsFullScreen, isSaved, setIsSaved, showExitDecision, setShowExitDecision,
    diagnosisExpanded, setDiagnosisExpanded, selectedProduct, setSelectedProduct, productAlternatives,
    acceptedItems, basketProductIds, expandedWhyGroups, isFinalizing, handleFinalize,
    toggleAcceptedItem: id => setSelection(previous => ({ ...previous, accepted: toggle(previous.accepted, id) })),
    toggleBasketProduct: id => { if (products.some(product => product.id === id && product.uniqueLink)) setSelection(previous => ({ ...previous, products: toggle(previous.products, id) })); },
    toggleWhyExpanded: id => setExpandedWhyGroups(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }),
    updateItemQuantity: (id, count) => setSelection(previous => ({ ...previous, quantities: { ...previous.quantities, [id]: quantity(count) } })),
    updateProductQuantity: (id, count) => setSelection(previous => ({ ...previous, productQuantities: { ...previous.productQuantities, [id]: quantity(count) } })),
    productQuantityOverrides: new Map(Object.entries(selection.productQuantities).map(([id, count]) => [id, quantity(count)])),
    checklistCheckedIds: new Set(selection.checklist),
    toggleChecklistItem: id => setSelection(previous => ({ ...previous, checklist: toggle(previous.checklist, id) })),
    completionChecklistItems: categoryGroups.filter(group => group.actionStatus === 'custom_order'),
    selectedPrice, selectedCount: selectedLines.length,
    recommendedTotalPrice: plan?.known_subtotal_rial || 0,
    diagnosisDetail: summaries.map(summary => summary.positive_diagnosis).filter(Boolean).join('\n'),
    projectName: t('studio.result.v2.roomFallback'), targetStyle: '',
    priorityRankedIds: categoryGroups.filter(group => group.impactKnown).map(group => group.itemId),
    isInitialized: true, isLoading: false, isDownloading: imageActions.isDownloading,
    handleDownload: async () => imageActions.onDownload(), handleConfirmDownload: async () => {}, handleCancelDownload: () => {}, showDownloadReady: false,
    handleProductClick: setSelectedProduct, scrollToCard, handleImageMarkerClick: scrollToCard,
    isRequestingRedesignCredit: false, handleRequestRedesignCredit: async () => onOpenChat(),
  };
}
