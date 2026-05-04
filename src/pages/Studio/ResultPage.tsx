/**
 * Studio Result Page — Editorial / Decision-Oriented Orchestrator
 *
 * Two-panel layout:
 *   - Right sidebar (520px on desktop): Editorial content scroll
 *   - Left panel: Full-bleed hero image
 *   - Floating glass capsule at bottom: phase navigation
 *
 * Phase-aware: analysis → recommendations → basket
 * Bottom capsule is a frosted-glass pill with three tabs only.
 *
 * Uses design tokens from globals.css throughout.
 */
import { AnimatePresence } from 'motion/react';
import { Loader2, Download as DownloadIcon, Bookmark } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ContextLock } from '@/components/studio/ContextLock';
import { ProductDetailSheet } from './components/ProductDetailSheet';
import { InlineFeedbackWidget } from '@/components/InlineFeedbackWidget';
import { useSimpleTranslation } from './result/types';
import { useStudioResult } from './result/useStudioResult';
import { ImpactProgressCard } from './result/ImpactProgressCard';
import { SpatialDiagnosis } from './result/SpatialDiagnosis';
import type { DetectedContext } from './result/SpatialDiagnosis';
import type { DiagnosisAction } from './result/DiagnosisActionCard';
import { TierSection } from './result/TierSection';
import { CollectionSummary } from './result/CollectionSummary';
import { InvoiceSummary } from './result/InvoiceSummary';
import { DesktopHeroPanel, MobileHeroSection } from './result/HeroImagePanel';
import { FullscreenOverlay } from './result/FullscreenOverlay';
import { ExitDecisionModal } from './result/ExitDecisionModal';
import { DownloadReadyModal } from './result/DownloadReadyModal';
import { CompletionChecklist } from './result/CompletionChecklist';
import { UnifiedConsultationCTA } from './result/UnifiedConsultationCTA';
import { toLocalizedDigits } from '@/utils/formatters';
import type { CompletionChecklistItem } from './result/types';

type Phase = 'analysis' | 'recommendations' | 'basket';

const FONT = 'var(--font-family-vazirmatn)';

export function StudioResultPage() {
  const { t } = useSimpleTranslation();
  const state = useStudioResult();

  /* ── Detected context metadata ── */
  const roomTypeDisplay = state.projectName || state.categoryGroups[0]?.categoryDisplay || '';
  const detectedContext: DetectedContext | undefined = roomTypeDisplay
    ? {
        roomType: roomTypeDisplay,
        targetStyle: state.targetStyle || '',
        naturalLight: '',
        dominantSurfaces: '',
      }
    : undefined;

  /* ── Diagnosis Actions — built from real AI category groups ── */
  const diagnosisActions: DiagnosisAction[] = (() => {
    return state.categoryGroups.map((group) => ({
      id: group.itemId,
      status:
        group.harmonyImpact >= 7
          ? ('critical' as const)
          : group.harmonyImpact >= 4
            ? ('warning' as const)
            : ('good' as const),
      title: group.categoryDisplay,
      diagnosis: group.problemStatement || group.fitReasoningFa || '',
      solution: group.designStrategy || '',
      ctaText: '',
      linkedItemId: group.itemId,
      harmonyImpact: group.harmonyImpact,
      iconType: 'default' as const,
    }));
  })();

  /* ── Compute step numbering across all tiers ── */
  const tierStepOffsets: number[] = [];
  let runningStep = 0;
  for (const { items } of state.tierGroups) {
    tierStepOffsets.push(runningStep);
    runningStep += items.length;
  }

  /* ── Counts ── */
  const purchasableCount = state.categoryGroups.filter(
    (g) => g.actionStatus === 'available' && g.products.length > 0,
  ).length;

  /* ── Map CategoryGroup[] → CompletionChecklistItem[] for checklist/consultation ── */
  const checklistItems: CompletionChecklistItem[] = state.completionChecklistItems.map(g => ({
    id: g.itemId,
    name: g.categoryDisplay,
    category: g.category,
    imageUrl: g.referenceImageUrl || '',
    aiReasoning: g.fitReasoningFa || g.designStrategy,
  }));

  /* ── Phase tracking (scroll-aware) ── */
  const [activePhase, setActivePhase] = useState<Phase>('analysis');
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((sectionId: string) => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const container = isDesktop ? desktopScrollRef.current : mobileScrollRef.current;
    if (!container) return;
    const target = container.querySelector(`#${sectionId}`) as HTMLElement | null;
    if (target) {
      const offset = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, []);

  const handlePhaseClick = useCallback((phase: Phase) => {
    setActivePhase(phase);
    const map: Record<Phase, string> = {
      analysis: 'section-analysis',
      recommendations: 'section-products',
      basket: 'section-basket',
    };
    scrollToSection(map[phase]);
  }, [scrollToSection]);

  /* ── Track active phase on scroll ── */
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const container = isDesktop ? desktopScrollRef.current : mobileScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const threshold = containerRect.top + containerRect.height * 0.4;
      const basketEl = container.querySelector('#section-basket') as HTMLElement | null;
      const productsEl = container.querySelector('#section-products') as HTMLElement | null;

      if (basketEl && basketEl.getBoundingClientRect().top < threshold) {
        setActivePhase('basket'); return;
      }
      if (productsEl && productsEl.getBoundingClientRect().top < threshold) {
        setActivePhase('recommendations'); return;
      }
      setActivePhase('analysis');
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [state.isInitialized]);

  /* ── Shared bottom dock props ── */
  const dockProps = {
    activePhase,
    onNavigateToPhase: handlePhaseClick,
    selectedPrice: state.selectedPrice,
    selectedCount: state.selectedCount,
    totalCount: purchasableCount,
    totalPrice: state.totalPrice,
    totalRecommendations: state.categoryGroups.length,
    harmonyScore: state.harmonyScore,
    projectedScore: state.projectedScore,
    liveProjectedScore: state.liveProjectedScore,
    onFinalize: state.handleFinalize,
  };

  /* ── scrollToAnalysis helper for cards ── */
  const scrollToAnalysis = useCallback(() => {
    handlePhaseClick('analysis');
  }, [handlePhaseClick]);

  /* ── InsightContent: shared between mobile & desktop ── */
  const InsightContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div
      className="flex flex-col"
      style={{
        fontFamily: FONT,
        padding: isDesktop ? '0 var(--spacing-xl)' : '0 var(--spacing-md)',
        paddingBottom: 'var(--spacing-xl)',
      }}
    >
      {/* ── Desktop Minimal Header ── */}
      {isDesktop && (
        <div
          className="flex items-center justify-between"
          style={{
            paddingBottom: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          {/* Right: title + subtitle */}
          <div className="flex flex-col" style={{ gap: '2px' }}>
            <h1
              style={{
                fontSize: 'var(--text-label-size)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: FONT,
                color: 'var(--editorial-charcoal)',
                lineHeight: 1.4,
              }}
            >
              {state.projectName || 'نتیجه طراحی'}
              {state.targetStyle && (
                <span
                  style={{
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--editorial-taupe)',
                    marginRight: '6px',
                  }}
                >
                  ({state.targetStyle})
                </span>
              )}
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'var(--font-weight-regular)',
                fontFamily: FONT,
                color: 'var(--editorial-taupe)',
              }}
            >
              تحلیل اختصاصی
            </span>
          </div>

          {/* Left: action icons */}
          <div className="flex items-center" style={{ gap: '6px' }}>
            <button
              onClick={() => state.setIsSaved(!state.isSaved)}
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                background: state.isSaved ? 'rgba(0,0,0,0.04)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: state.isSaved ? 'var(--editorial-charcoal)' : 'var(--editorial-taupe)',
              }}
              aria-label={state.isSaved ? 'ذخیره شده' : 'ذخیره'}
            >
              <Bookmark size={16} strokeWidth={1.5} fill={state.isSaved ? 'currentColor' : 'none'} />
            </button>
            {!state.isNoImageResult && (
              <button
                onClick={state.handleDownload}
                disabled={state.isDownloading}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                  background: 'transparent', border: 'none',
                  cursor: state.isDownloading ? 'not-allowed' : 'pointer',
                  color: 'var(--editorial-taupe)',
                  opacity: state.isDownloading ? 0.4 : 1,
                }}
                aria-label="دانلود"
              >
                {state.isDownloading
                  ? <Loader2 size={16} className="animate-spin" strokeWidth={1.5} />
                  : <DownloadIcon size={16} strokeWidth={1.5} />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Phase 1: Analysis (Decision Dashboard) ── */}
      <div id="section-analysis">
        {state.isNoImageResult && (
          <div
            style={{
              padding: '12px 14px',
              marginBottom: 'var(--spacing-md)',
              border: '1px solid var(--editorial-hairline)',
              background: 'rgba(255,255,255,0.55)',
              color: 'var(--editorial-charcoal)',
              fontSize: '12px',
              lineHeight: 1.8,
            }}
          >
            <p>این نتیجه بدون تولید تصویر بازطراحی آماده شده است. پیشنهادها بر اساس تحلیل همین فضا هستند.</p>
            <button
              onClick={state.handleRequestRedesignCredit}
              disabled={state.isRequestingRedesignCredit}
              style={{
                marginTop: '10px',
                height: '36px',
                padding: '0 14px',
                background: 'var(--editorial-charcoal)',
                color: 'var(--editorial-stone)',
                fontSize: '12px',
                fontFamily: FONT,
                fontWeight: 'var(--font-weight-semibold)',
                opacity: state.isRequestingRedesignCredit ? 0.6 : 1,
              }}
            >
              {state.isRequestingRedesignCredit
                ? 'در حال ثبت درخواست...'
                : 'درخواست تولید تصویر بازطراحی برای این طراحی'}
            </button>
          </div>
        )}

        {/* Harmony Score Gauge */}
        <ImpactProgressCard
          currentScore={state.harmonyScore}
          liveProjectedScore={state.liveProjectedScore}
          maxProjectedScore={state.projectedScore}
          acceptedCount={state.acceptedItems.size}
          totalCount={state.categoryGroups.length}
        />

        <SpatialDiagnosis
          harmonyScore={state.harmonyScore}
          projectedScore={state.projectedScore}
          totalPrice={state.totalPrice}
          selectedPrice={state.selectedPrice}
          selectedCount={state.selectedCount}
          diagnosisDetail={state.diagnosisDetail}
          diagnosisExpanded={state.diagnosisExpanded}
          onToggleDiagnosis={() => state.setDiagnosisExpanded(!state.diagnosisExpanded)}
          detectedContext={detectedContext}
          diagnosisActions={diagnosisActions}
        />
      </div>

      {/* Divider */}
      <div style={{
        width: '100%', height: '1px',
        background: 'var(--editorial-hairline)', marginBottom: 'var(--spacing-xl)',
      }} />

      {/* ── Phase 2: Recommendations ── */}
      <div
        id="section-products"
        className="flex justify-between items-center"
        style={{ marginBottom: 'var(--spacing-lg)' }}
      >
        <h2 style={{
          fontSize: '18px', fontWeight: 'var(--font-weight-semibold)',
          fontFamily: FONT, color: 'var(--editorial-charcoal)',
        }}>
          پیشنهادهای ما برای شما
        </h2>
        <span style={{
          fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-regular)',
          fontFamily: FONT, color: 'var(--editorial-taupe)',
        }}>
          {toLocalizedDigits(state.categoryGroups.length)} مرحله
        </span>
      </div>

      {state.tierGroups.map(({ tier, items }, tierIdx) => (
        <TierSection
          key={tier} tier={tier} items={items}
          allCategoryGroups={state.categoryGroups}
          stepStartIndex={tierStepOffsets[tierIdx] || 0}
          priorityRankedIds={state.priorityRankedIds}
          expandedWhyGroups={state.expandedWhyGroups}
          acceptedItems={state.acceptedItems}
          basketProductIds={state.basketProductIds}
          isSaved={state.isSaved}
          sessionId={state.sessionId ?? state.activeSessionId ?? undefined}
          onToggleWhy={state.toggleWhyExpanded}
          onProductClick={state.handleProductClick}
          onToggleSaved={() => state.setIsSaved(!state.isSaved)}
          onToggleAccepted={state.toggleAcceptedItem}
          onToggleBasketProduct={state.toggleBasketProduct}
          onScrollToAnalysis={scrollToAnalysis}
          onUpdateQuantity={state.updateItemQuantity}
        />
      ))}

      {/* ── Completion Checklist — AI suggestions NOT in Huma's store ── */}
      <CompletionChecklist
        items={checklistItems}
        checkedIds={state.checklistCheckedIds}
        onToggleItem={state.toggleChecklistItem}
      />

      {/* ── Unified Consultation CTA — single button for all action items ── */}
      <UnifiedConsultationCTA
        serviceItems={state.categoryGroups.filter(
          g => g.actionStatus === 'custom_order' || g.actionStatus === 'architectural'
        )}
        acceptedServiceIds={state.acceptedItems}
        sourcingItems={checklistItems}
        checkedSourcingIds={state.checklistCheckedIds}
      />

      {/* ── Phase 3: Basket ── */}
      <div id="section-basket">
        <InvoiceSummary
          categoryGroups={state.categoryGroups}
          acceptedItems={state.acceptedItems}
          basketProductIds={state.basketProductIds}
          selectedPrice={state.selectedPrice}
          harmonyScore={state.harmonyScore}
          projectedScore={state.projectedScore}
          liveProjectedScore={state.liveProjectedScore}
          onToggleAccepted={state.toggleAcceptedItem}
          onToggleBasketProduct={state.toggleBasketProduct}
          onFinalize={state.handleFinalize}
          onUpdateQuantity={state.updateItemQuantity}
          onUpdateProductQuantity={state.updateProductQuantity}
          productQuantityOverrides={state.productQuantityOverrides}
        />
      </div>

      {/* Feedback */}
      <div style={{ paddingTop: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)' }}>
        <InlineFeedbackWidget flow="studio" sessionId={state.activeSessionId || state.sessionId} />
      </div>

      {/* Spacer for bottom dock */}
      <div style={{ height: '80px' }} />
    </div>
  );

  /* ── Hero Props ── */
  const heroProps = {
    resultImage: state.resultImage, originalImage: state.originalImage,
    showOriginal: state.showOriginal, isSaved: state.isSaved,
    isDownloading: state.isDownloading,
    isNoImageResult: state.isNoImageResult,
    sessionId: state.sessionId ?? state.activeSessionId ?? undefined,
    totalPrice: state.totalPrice,
    onToggleOriginal: state.setShowOriginal,
    onToggleSaved: () => state.setIsSaved(!state.isSaved),
    onDownload: state.handleDownload,
    onFullscreen: () => !state.isNoImageResult && state.setIsFullScreen(true),
    onExit: () => state.setShowExitDecision(true),
  };

  return (
    <div
      className="h-screen w-full relative overflow-hidden flex flex-col select-none"
      dir="rtl"
      style={{ fontFamily: FONT, background: 'var(--editorial-stone)' }}
    >
      {/* Mobile Header + Context */}
      {!state.isFullScreen && (
        <div className="md:hidden">
          <Header />
          <ContextLock
            projectName={state.projectName || 'پروژه طراحی'}
            targetStyle={state.targetStyle}
            variant="mobile"
          />
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Desktop Right Panel */}
        <div
          className="hidden md:flex flex-col h-full z-50 relative"
          style={{ width: '520px', background: 'var(--editorial-stone)', borderLeft: '1px solid var(--editorial-hairline)' }}
        >
          <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingTop: 'var(--spacing-xl)' }} ref={desktopScrollRef}>
            <InsightContent isDesktop />
          </div>
          <CollectionSummary {...dockProps} />
        </div>

        {/* Desktop Left Panel (Hero) */}
        <DesktopHeroPanel {...heroProps} />

        {/* Mobile Layout */}
        <div className="md:hidden absolute inset-0 flex flex-col z-0" style={{ background: 'var(--editorial-stone)' }}>
          <div ref={mobileScrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
            <MobileHeroSection {...heroProps} />
            <div
              className="relative z-30 min-h-[50vh]"
              style={{
                marginTop: '-24px', background: 'var(--editorial-stone)',
                borderRadius: 'var(--radius-3xl) var(--radius-3xl) 0 0',
                paddingTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-md)',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.06)',
              }}
            >
              <div className="mx-auto" style={{
                width: '36px', height: '4px', borderRadius: 'var(--radius-full)',
                background: 'var(--editorial-charcoal)', opacity: 0.08, marginBottom: '12px',
              }} />
              <InsightContent />
            </div>
          </div>
          <CollectionSummary {...dockProps} />
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {state.isFullScreen && (
          !state.isNoImageResult && (
          <FullscreenOverlay
            resultImage={state.resultImage} originalImage={state.originalImage}
            showOriginal={state.showOriginal} isSaved={state.isSaved} isDownloading={state.isDownloading}
            onClose={() => state.setIsFullScreen(false)} onToggleOriginal={state.setShowOriginal}
            onToggleSaved={() => state.setIsSaved(!state.isSaved)} onDownload={state.handleDownload}
          />
          )
        )}
      </AnimatePresence>

      {/* Product Detail */}
      {state.selectedProduct && (
        <ProductDetailSheet
          product={state.selectedProduct} isOpen={!!state.selectedProduct}
          onClose={() => state.setSelectedProduct(null)} onReplace={() => {}}
          alternatives={state.productAlternatives}
          redesignSessionId={state.activeSessionId ?? state.sessionId}
        />
      )}

      {/* Exit Decision */}
      <AnimatePresence>
        {state.showExitDecision && (
          <ExitDecisionModal
            onConfirm={() => { state.setIsSaved(true); state.setShowExitDecision(false); state.navigate('/studio'); }}
            onCancel={() => state.setShowExitDecision(false)}
          />
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {state.isLoading && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center"
            style={{ background: 'rgba(250,249,246,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--editorial-charcoal)', opacity: 0.3 }} />
              <span style={{ fontSize: '13px', fontFamily: FONT, fontWeight: 'var(--font-weight-regular)', color: 'var(--editorial-taupe)' }}>
                {t('common.loading', 'در حال بارگذاری...')}
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Download Ready */}
      <AnimatePresence>
        {state.showDownloadReady && (
          <DownloadReadyModal onConfirm={state.handleConfirmDownload} onCancel={state.handleCancelDownload} />
        )}
      </AnimatePresence>
    </div>
  );
}
