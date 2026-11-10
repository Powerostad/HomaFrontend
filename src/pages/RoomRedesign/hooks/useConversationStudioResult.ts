import { useBasket } from '@/context/BasketContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../Studio/components/ProductDetailSheet';
import type { TierGroup } from '../../Studio/result/types';
import type { StudioResultViewState } from '../../Studio/result/viewState';
import { useImageActions } from '../components/workspace';
import { checkStudioPurchase, type ExecutionPlan, type StudioPurchaseLine } from '../services/redesignChatService';
import { mergeCheckedLines, sameSelections } from '../services/studioPurchase';
import { toast } from 'sonner';
import { toStudioCategoryGroups } from '../services/studioResultAdapter';
import { applyPrimaryProducts } from '../../Studio/result/productChoices';

interface Selection {
  accepted: number[];
  products: string[];
  quantities: Record<number, number>;
  productQuantities: Record<string, number>;
  checklist: number[];
  primary: Record<number, string>;
}
const emptySelection = (): Selection => ({ accepted: [], products: [], quantities: {}, productQuantities: {}, checklist: [], primary: {} });
function restoreSelection(key: string): Selection {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null') as Partial<Selection> | null;
    if (!value || !Array.isArray(value.accepted) || !Array.isArray(value.products)) return emptySelection();
    return { accepted: value.accepted.filter(Number.isInteger), products: value.products.filter(id => typeof id === 'string'),
      quantities: value.quantities || {}, productQuantities: value.productQuantities || {}, checklist: Array.isArray(value.checklist) ? value.checklist.filter(Number.isInteger) : [], primary: value.primary && typeof value.primary === 'object' ? value.primary : {} };
  } catch { return emptySelection(); }
}
function toggle<T>(items: T[], value: T) { return items.includes(value) ? items.filter(item => item !== value) : [...items, value]; }
function quantity(value: number) { return Number.isFinite(value) ? Math.max(1, Math.min(99, Math.round(value))) : 1; }

export function useConversationStudioResult({ plan, previousPlan = null, sessionId, versionId, resultImage, originalImage, showOriginal, onToggleOriginal, onOpenChat, onChooseProduct }: {
  previousPlan?: ExecutionPlan | null;
  plan: ExecutionPlan | null; sessionId: string | null; versionId: string; resultImage: string; originalImage: string | null;
  showOriginal: boolean; onToggleOriginal: (show: boolean) => void; onOpenChat: () => void;
  onChooseProduct?: (product: Product) => void;
}): StudioResultViewState {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const basket = useBasket();
  const storageKey = `homa.studio.selection:${sessionId || 'new'}:${versionId}`;
  const [selection, setSelection] = useState(() => restoreSelection(storageKey));
  const selectionKey = useRef(storageKey);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSaved, setIsSaved] = useState(!!sessionId);
  const [showExitDecision, setShowExitDecision] = useState(false);
  const [diagnosisExpanded, setDiagnosisExpanded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedWhyGroups, setExpandedWhyGroups] = useState<Set<number>>(new Set());
  const [isFinalizing, setIsFinalizing] = useState(false);
  const finalizing = useRef(false);
  const isV2 = plan?.search_version === 'studio-search-v2' || !!plan?.purchases.some(item => item.product?.search_version === 'studio-search-v2');
  const groupIds = useRef<{ key: string; ids: Map<string, number> }>({ key: '', ids: new Map() });
  const canonicalProducts = useRef(new Map<string, string>());
  const canonicalQuantities = useRef(new Map<string, number>());
  const baseGroups = useMemo(() => toStudioCategoryGroups(plan, previousPlan).map(group => {
    const key = group.workspaceKey || String(group.itemId);
    if (groupIds.current.key !== storageKey) {
      let entries: [string, number][] = [];
      try { entries = JSON.parse(sessionStorage.getItem(`${storageKey}:groups`) || '[]'); } catch { /* optional memory */ }
      groupIds.current = { key: storageKey, ids: new Map(entries) };
    }
    const ids = groupIds.current.ids;
    if (!ids.has(key)) ids.set(key, Math.max(0, ...ids.values()) + 1);
    return { ...group, itemId: ids.get(key)! };
  }), [plan, previousPlan, storageKey]);
  useEffect(() => {
    try { sessionStorage.setItem(`${storageKey}:groups`, JSON.stringify([...groupIds.current.ids])); } catch { /* optional memory */ }
    const next = new Map(baseGroups.map(group => [group.workspaceKey || String(group.itemId), group.products[0]?.id || '']));
    const changed = baseGroups.filter(group => {
      const key = group.workspaceKey || String(group.itemId);
      return canonicalProducts.current.has(key) && canonicalProducts.current.get(key) !== next.get(key);
    });
    const quantityChanged = baseGroups.filter(group => {
      const key = group.workspaceKey || String(group.itemId);
      return canonicalQuantities.current.has(key) && canonicalQuantities.current.get(key) !== group.quantity;
    });
    canonicalProducts.current = next;
    canonicalQuantities.current = new Map(baseGroups.map(group => [group.workspaceKey || String(group.itemId), group.quantity]));
    setSelectedProduct(previous => previous && !baseGroups.some(group => group.products.some(product => product.id === previous.id)) ? null : previous);
    if (changed.length || quantityChanged.length) setSelection(previous => ({ ...previous,
      primary: Object.fromEntries(Object.entries(previous.primary).filter(([id]) => !changed.some(group => group.itemId === Number(id)))),
      quantities: Object.fromEntries(Object.entries(previous.quantities).filter(([id]) => !quantityChanged.some(group => group.itemId === Number(id)))) }));
  }, [baseGroups, storageKey]);
  const categoryGroups = useMemo(() => (isV2 && onChooseProduct ? baseGroups : applyPrimaryProducts(baseGroups, selection.primary)).map(group => ({ ...group, quantity: isV2 ? group.quantity : quantity(selection.quantities[group.itemId] ?? group.quantity) })), [baseGroups, selection.quantities, selection.primary, isV2, onChooseProduct]);
  const tierGroups = useMemo<TierGroup[]>(() => (['quick_win', 'enhancement', 'structural'] as const)
    .map(tier => ({ tier, items: categoryGroups.filter(group => group.interventionTier === tier) })).filter(group => group.items.length), [categoryGroups]);
  const validIds = new Set(categoryGroups.map(group => group.itemId));
  const acceptedItems = new Set(selection.accepted.filter(id => validIds.has(id)));
  const products = categoryGroups.flatMap(group => group.products);
  const basketProductIds = new Set(selection.products.filter(id => products.some(product => product.id === id && product.uniqueLink)));
  const selectedLines = categoryGroups.flatMap(group => group.products.flatMap((product, index) => basketProductIds.has(product.id)
    ? [{ product, quantity: isV2 || index === 0 ? group.quantity : quantity(selection.productQuantities[product.id] ?? group.quantity) }] : []));
  const selectedPrice = selectedLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const imageActions = useImageActions({ image: showOriginal ? originalImage : resultImage, originalImage, activeVersion: 1, isPreview: !showOriginal });
  const productAlternatives = selectedProduct ? categoryGroups.find(group => group.products.some(product => product.id === selectedProduct.id))?.products.filter(product => product.id !== selectedProduct.id) || [] : [];
  const summaries = Object.values(plan?.studio_documents || {}).flatMap(document => document?.user_facing_summary ? [document.user_facing_summary] : []);
  useEffect(() => {
    if (selectionKey.current !== storageKey) {
      selectionKey.current = storageKey;
      setSelection(restoreSelection(storageKey));
      return;
    }
    try { sessionStorage.setItem(storageKey, JSON.stringify(selection)); } catch { /* Selection still works without storage. */ }
  }, [selection, storageKey]);
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
      let desired: { link: string; variantId: number | null; quantity: number }[];
      if (isV2) {
        if (!sessionId || selectedLines.some(l => !l.product.studioItemId || !l.product.studioProductId)) return;
        const requested: StudioPurchaseLine[] = selectedLines.map(({ product, quantity: count }) => ({
          item_id: product.studioItemId!, placement_id: product.studioPlacementId, product_id: product.studioProductId!,
          variant_id: product.variantId ?? null, quantity: count,
        }));
        const checked = await checkStudioPurchase(sessionId, versionId, requested);
        if (!checked.success || !checked.data?.ready || !sameSelections(requested, checked.data.lines)) {
          toast.error(t('studioV2.purchaseBlocked')); onOpenChat(); return;
        }
        if (checked.data.lines.some(line => selectedLines.find(l => l.product.studioItemId === line.item_id &&
          (l.product.studioPlacementId ?? null) === (line.placement_id ?? null))?.product.price !== line.unit_price_rial)) {
          toast.error(t('studioV2.priceChanged')); onOpenChat(); return;
        }
        desired = mergeCheckedLines(checked.data.lines);
      } else {
        const grouped = new Map<string, { link: string; variantId: number | null; quantity: number }>();
        for (const { product, quantity: count } of selectedLines) if (product.uniqueLink) {
          const variantId = product.variantId ?? null;
          const key = `${product.uniqueLink}/${variantId ?? 'parent'}`;
          grouped.set(key, { link: product.uniqueLink, variantId, quantity: (grouped.get(key)?.quantity || 0) + count });
        }
        desired = [...grouped.values()];
      }
      for (const { link, variantId, quantity: count } of desired) {
        const existing = basket.basket.shop_groups.flatMap(group => group.items).find(item => item.product_unique_link === link && (item.variant_id ?? null) === variantId);
        if (existing) {
          if (existing.quantity < count && !await basket.updateQuantity(existing.id, count)) return;
        } else if (!await basket.addItem({ product_unique_link: link, ...(isV2 || variantId != null ? { variant_id: variantId } : {}), source_context: 'studio', quantity: count })) return;
      }
      basket.openBasket();
    } catch { toast.error(t('studioV2.purchaseBlocked'));
    } finally { finalizing.current = false; setIsFinalizing(false); }
  };
  return {
    navigate, sessionId: sessionId || undefined, activeSessionId: null, categoryGroups, tierGroups,
    resultImage, originalImage, showOriginal, setShowOriginal: onToggleOriginal, analysisOnly: !resultImage || resultImage === originalImage,
    isFullScreen, setIsFullScreen, isSaved, setIsSaved, showExitDecision, setShowExitDecision,
    diagnosisExpanded, setDiagnosisExpanded, selectedProduct, setSelectedProduct, productAlternatives,
    acceptedItems, basketProductIds, expandedWhyGroups, isFinalizing, handleFinalize,
    toggleAcceptedItem: id => setSelection(previous => ({ ...previous, accepted: toggle(previous.accepted, id) })),
    toggleBasketProduct: id => {
      const product = products.find(p => p.id === id && p.uniqueLink);
      if (product?.purchaseStatus && product.purchaseStatus !== 'ready' && !selection.products.includes(id)) { toast.error(t('studioV2.purchaseBlocked')); return; }
      if (product) setSelection(previous => ({ ...previous, products: isV2 && !previous.products.includes(id)
        ? [...previous.products.filter(selected => !products.some(p => p.id === selected && p.studioItemId === product.studioItemId && p.studioPlacementId === product.studioPlacementId)), id]
        : toggle(previous.products, id) }));
    },
    makePrimaryProduct: (itemId, productId) => {
      if (isV2 && onChooseProduct) {
        const product = categoryGroups.find(g => g.itemId === itemId)?.products.find(p => p.id === productId);
        if (product) onChooseProduct(product);
        return;
      }
      setSelection(previous => {
        const group = applyPrimaryProducts(baseGroups, previous.primary).find(item => item.itemId === itemId);
        const next = group?.products.find(product => product.id === productId);
        const old = group?.products[0];
        if (!group || !next || !old || old.id === next.id) return previous;
        const selected = previous.products.includes(old.id);
        return { ...previous, primary: { ...previous.primary, [itemId]: next.id },
          products: selected ? [...previous.products.filter(id => id !== old.id && id !== next.id), ...(next.uniqueLink ? [next.id] : [])] : previous.products,
          productQuantities: { ...previous.productQuantities, [old.id]: quantity(previous.quantities[itemId] ?? group.quantity) } };
      });
    },
    toggleWhyExpanded: id => setExpandedWhyGroups(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }),
    updateItemQuantity: (id, count) => { if (isV2) onOpenChat(); else setSelection(previous => ({ ...previous, quantities: { ...previous.quantities, [id]: quantity(count) } })); },
    updateProductQuantity: (id, count) => { if (isV2) onOpenChat(); else setSelection(previous => ({ ...previous, productQuantities: { ...previous.productQuantities, [id]: quantity(count) } })); },
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
