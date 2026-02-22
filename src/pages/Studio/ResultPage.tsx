/**
 * Studio Result Page — Phase-Aware Editorial Orchestrator
 *
 * Two-panel layout:
 *   Desktop (>=1024px): HeroImagePanel (flex-1 left) + scrolling sidebar (w-[520px], max-w-[45vw] right)
 *   Mobile: HeroImagePanel (65vh) stacked on top + rounded card container below
 *
 * Phase rendering inside sidebar/card:
 *   analysis        → SpatialDiagnosis (skipped if no diagnosis)
 *   recommendations → TierSections + CompletionChecklist + UnifiedConsultationCTA
 *   basket          → InvoiceSummary
 *
 * Fixed elements:
 *   CollectionSummary (bottom dock, all phases)
 *   ProductDetailSheet (triggered by selectedProduct)
 *   FullscreenOverlay (triggered by isFullScreen)
 *   ExitDecisionModal (triggered by showExitModal)
 *
 * All state managed by useStudioResult() hook — this component is thin orchestration.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { AuthModal } from '../../components/AuthModal';
import { HomaLoader } from '../../components/HomaLoader';
import { InlineFeedbackWidget } from '@/components/InlineFeedbackWidget';
import { ProductDetailSheet } from './components/ProductDetailSheet';

import { useStudioResult } from './result/useStudioResult';
import { HeroImagePanel } from './result/HeroImagePanel';
import { SpatialDiagnosis } from './result/SpatialDiagnosis';
import { TierSection } from './result/TierSection';
import { CollectionSummary } from './result/CollectionSummary';
import { InvoiceSummary } from './result/InvoiceSummary';
import { CompletionChecklist } from './result/CompletionChecklist';
import { UnifiedConsultationCTA } from './result/UnifiedConsultationCTA';
import { FullscreenOverlay } from './result/FullscreenOverlay';
import { ExitDecisionModal } from './result/ExitDecisionModal';
import { DownloadReadyModal } from './result/DownloadReadyModal';

import { toLocalizedDigits } from '@/utils/formatters';
import {
  trackStudioResultAction,
} from '@/analytics/events';

// ---------------------------------------------------------------------------
// InsightContent — phase-aware sidebar/card content
// ---------------------------------------------------------------------------

function InsightContent({
  isDesktop = false,
  state,
}: {
  isDesktop?: boolean;
  state: ReturnType<typeof useStudioResult>;
}) {
  const { t } = useTranslation();
  const { phase, activeSession, tierGroups, completionChecklistItems, categoryGroups } = state;

  // Compute sequential step numbering across all tiers
  const tierStepOffsets = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (const tg of tierGroups) {
      offsets.push(running);
      running += tg.items.length;
    }
    return offsets;
  }, [tierGroups]);

  // Service items: categories with non-available actionStatus that have products
  const serviceItems = useMemo(
    () => categoryGroups.filter(
      g => g.actionStatus === 'custom_order' || g.actionStatus === 'architectural',
    ),
    [categoryGroups],
  );

  const hasNonAvailableItems = serviceItems.length > 0 || completionChecklistItems.length > 0;

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: 'var(--font-family-vazirmatn)',
        padding: isDesktop ? '0 var(--spacing-xl)' : '0 var(--spacing-md)',
        paddingBottom: 'var(--spacing-xl)',
      }}
    >
      {/* ---------------------------------------------------------------- */}
      {/* Phase: Analysis                                                  */}
      {/* ---------------------------------------------------------------- */}
      {phase === 'analysis' && (
        <div id="section-analysis">
          {activeSession?.diagnosis ? (
            <SpatialDiagnosis
              diagnosis={activeSession.diagnosis}
              diagnosisExpanded={state.diagnosisExpanded}
              onToggleDiagnosis={() => state.setDiagnosisExpanded(!state.diagnosisExpanded)}
              totalPrice={state.totalPrice}
              selectedPrice={state.selectedPrice}
              actionCount={state.categoryGroups.length}
            />
          ) : (
            // No diagnosis data (old sessions) — show a brief note, then auto-advance
            <AutoAdvanceToRecommendations onAdvance={state.goToRecommendations} />
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Phase: Recommendations                                           */}
      {/* ---------------------------------------------------------------- */}
      {phase === 'recommendations' && (
        <div id="section-products">
          {/* Section header */}
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: 'var(--spacing-lg)' }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--color-editorial-charcoal)',
                margin: 0,
              }}
            >
              {t('studio.result.v2.recommendations.title', 'پیشنهادهای ما برای شما')}
            </h2>
            <span
              style={{
                fontSize: 'var(--text-caption-size, 12px)',
                color: 'var(--color-editorial-taupe)',
              }}
            >
              {toLocalizedDigits(categoryGroups.length)}{' '}
              {t('studio.result.v2.recommendations.stepCount', 'مرحله')}
            </span>
          </div>

          {/* Tier sections */}
          {tierGroups.map((tierGroup, tierIdx) => (
            <TierSection
              key={tierGroup.tier}
              tierGroup={tierGroup}
              stepStartIndex={tierStepOffsets[tierIdx] ?? 0}
              acceptedItems={state.acceptedItems}
              expandedWhyGroups={state.expandedWhyGroups}
              collapsedCards={state.collapsedCards}
              basketProductIds={state.basketProductIds}
              quantityOverrides={state.quantityOverrides}
              productQuantityOverrides={state.productQuantityOverrides}
              onToggleAccept={state.toggleAcceptedItem}
              onToggleWhy={state.toggleWhyExpanded}
              onToggleCollapse={state.toggleCardCollapsed}
              onSelectProduct={state.handleProductClick}
              toggleBasketProduct={state.toggleBasketProduct}
              setQuantity={state.updateItemQuantity}
              setProductQuantity={state.updateProductQuantity}
            />
          ))}

          {/* Completion checklist (non-purchasable items) */}
          {completionChecklistItems.length > 0 && (
            <CompletionChecklist
              items={completionChecklistItems}
              checkedIds={state.checklistCheckedIds}
              onToggleItem={state.toggleChecklistItem}
            />
          )}

          {/* Unified consultation CTA */}
          {hasNonAvailableItems && (
            <UnifiedConsultationCTA
              serviceItems={serviceItems}
              acceptedServiceIds={state.acceptedItems}
              checklistItems={completionChecklistItems}
              checkedChecklistIds={state.checklistCheckedIds}
              sessionId={state.sessionId || state.activeSessionId || undefined}
            />
          )}

          {/* Feedback widget */}
          <div style={{ paddingTop: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)' }}>
            <InlineFeedbackWidget
              flow="studio"
              sessionId={state.activeSessionId || state.sessionId}
            />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Phase: Basket                                                    */}
      {/* ---------------------------------------------------------------- */}
      {phase === 'basket' && (
        <div id="section-basket">
          <InvoiceSummary
            categoryGroups={categoryGroups}
            acceptedItems={state.acceptedItems}
            basketProductIds={state.basketProductIds}
            selectedPrice={state.selectedPrice}
            onToggleBasketProduct={state.toggleBasketProduct}
            onFinalize={state.handleFinalize}
            onUpdateQuantity={state.updateItemQuantity}
            onUpdateProductQuantity={state.updateProductQuantity}
            productQuantityOverrides={state.productQuantityOverrides}
          />
        </div>
      )}

      {/* Spacer for bottom dock */}
      <div style={{ height: '80px' }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutoAdvanceToRecommendations — renders when no diagnosis exists
// ---------------------------------------------------------------------------

function AutoAdvanceToRecommendations({ onAdvance }: { onAdvance: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    // Auto-skip to recommendations after a brief delay
    const timer = setTimeout(onAdvance, 300);
    return () => clearTimeout(timer);
  }, [onAdvance]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ padding: 'var(--spacing-xl) 0' }}
    >
      <span
        style={{
          fontSize: 'var(--text-caption-size, 12px)',
          color: 'var(--color-editorial-taupe)',
        }}
      >
        {t('studio.result.v2.analysis.noData', 'در حال انتقال به پیشنهادها...')}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function StudioResultPage() {
  const { t } = useTranslation();
  const state = useStudioResult();
  const [showExitModal, setShowExitModal] = useState(false);

  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Backwards compatibility: auto-skip analysis if no diagnosis data
  useEffect(() => {
    if (state.activeSession && !state.activeSession.diagnosis && state.phase === 'analysis') {
      state.goToRecommendations();
    }
  }, [state.activeSession, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save handler with analytics
  const handleSave = useCallback(() => {
    if (!state.isSaved) {
      trackStudioResultAction({
        action: 'save',
        session_id: state.sessionId || state.activeSessionId || '',
      });
    }
    state.setIsSaved(!state.isSaved);
  }, [state.isSaved, state.sessionId, state.activeSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Auth initialization loader
  // ---------------------------------------------------------------------------
  if (!state.isInitialized) {
    return (
      <div
        className="h-screen w-full flex items-center justify-center"
        style={{ background: 'var(--color-surface-page)' }}
        dir="rtl"
      >
        <HomaLoader />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Session loading state
  // ---------------------------------------------------------------------------
  const needsSessionLoad =
    state.sessionId && (!state.activeSession || state.activeSessionId !== state.sessionId);
  const showSessionLoader = state.isLoggedIn && needsSessionLoad;

  return (
    <div
      className="h-screen w-full relative overflow-hidden flex flex-col select-none"
      dir="rtl"
      style={{ fontFamily: 'var(--font-family-vazirmatn)', background: 'var(--color-surface-page)' }}
    >
      {/* ================================================================= */}
      {/* DESKTOP LAYOUT (>=1024px): Two-panel                              */}
      {/* ================================================================= */}
      <div className="hidden lg:flex flex-row h-full overflow-hidden">
        {/* Right sidebar — scrolling content */}
        <div
          ref={desktopScrollRef}
          className="flex flex-col h-full overflow-y-auto scrollbar-hide relative"
          style={{
            width: '520px',
            maxWidth: '45vw',
            borderLeft: '1px solid var(--color-editorial-hairline)',
            background: 'var(--color-surface-page)',
          }}
        >
          {/* Desktop header */}
          <div
            className="flex flex-col"
            style={{
              padding: 'var(--spacing-lg) var(--spacing-xl) var(--spacing-sm)',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-editorial-taupe)',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              {t('studio.result.v2.header.subtitle', 'تحلیل اختصاصی')}
            </span>
            <h1
              style={{
                fontSize: 'var(--text-h3-size, 16px)',
                fontWeight: 600,
                color: 'var(--color-editorial-charcoal)',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {t('studio.result.v2.header.title', 'تحلیل هوشمند فضا')}
            </h1>
          </div>

          {/* Phase content */}
          <InsightContent isDesktop state={state} />
        </div>

        {/* Left panel — hero image (flex-1) */}
        <HeroImagePanel
          redesignedImageUrl={state.resultImage}
          roomImageUrl={state.originalImage}
          showOriginal={state.showOriginal}
          onToggleOriginal={state.setShowOriginal}
          onSave={handleSave}
          onDownload={state.handleDownload}
          onExit={() => setShowExitModal(true)}
          onFullscreen={() => {
            trackStudioResultAction({
              action: 'fullscreen',
              session_id: state.sessionId || state.activeSessionId || '',
            });
            state.setIsFullScreen(true);
          }}
          isSaved={state.isSaved}
          downloadState={state.downloadState}
        />
      </div>

      {/* ================================================================= */}
      {/* MOBILE LAYOUT (<1024px): Stacked                                  */}
      {/* ================================================================= */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden">
        <div ref={mobileScrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Hero image (65vh) */}
          <HeroImagePanel
            redesignedImageUrl={state.resultImage}
            roomImageUrl={state.originalImage}
            showOriginal={state.showOriginal}
            onToggleOriginal={state.setShowOriginal}
            onSave={handleSave}
            onDownload={state.handleDownload}
            onExit={() => setShowExitModal(true)}
            onFullscreen={() => {
              trackStudioResultAction({
                action: 'fullscreen',
                session_id: state.sessionId || state.activeSessionId || '',
              });
              state.setIsFullScreen(true);
            }}
            isSaved={state.isSaved}
            downloadState={state.downloadState}
          />

          {/* Rounded card container */}
          <div
            className="relative z-30 min-h-[50vh]"
            style={{
              marginTop: '-24px',
              background: 'var(--color-surface-page)',
              borderRadius: 'var(--radius-3xl, 24px) var(--radius-3xl, 24px) 0 0',
              paddingTop: 'var(--spacing-md)',
              paddingBottom: 'var(--spacing-md)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.06)',
            }}
          >
            {/* Drag indicator */}
            <div
              className="mx-auto"
              style={{
                width: '36px',
                height: '4px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-editorial-charcoal)',
                opacity: 0.08,
                marginBottom: '12px',
              }}
            />
            <InsightContent state={state} />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FIXED ELEMENTS                                                    */}
      {/* ================================================================= */}

      {/* Collection Summary — bottom dock (all phases) */}
      <CollectionSummary
        phase={state.phase}
        onNavigateToPhase={state.setPhase}
        selectedCount={state.selectedCount}
        selectedPrice={state.selectedPrice}
      />

      {/* Product Detail Sheet */}
      {state.selectedProduct && (
        <ProductDetailSheet
          product={state.selectedProduct}
          isOpen={!!state.selectedProduct}
          onClose={() => state.setSelectedProduct(null)}
          onReplace={() => {}}
          alternatives={state.productAlternatives}
          redesignSessionId={state.activeSessionId || state.sessionId}
        />
      )}

      {/* Fullscreen Overlay */}
      <FullscreenOverlay
        isOpen={state.isFullScreen}
        resultImage={state.resultImage}
        originalImage={state.originalImage}
        showOriginal={state.showOriginal}
        onClose={() => state.setIsFullScreen(false)}
        onToggleOriginal={state.setShowOriginal}
      />

      {/* Exit Decision Modal */}
      <ExitDecisionModal
        isOpen={showExitModal}
        onSaveAndExit={() => {
          state.handleExit();
          setShowExitModal(false);
        }}
        onExitWithoutSaving={() => {
          setShowExitModal(false);
          state.navigate('/studio');
        }}
        onCancel={() => setShowExitModal(false)}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {(state.isLoading || showSessionLoader) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center"
            style={{
              background: 'rgba(250,249,246,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2
                className="animate-spin"
                size={32}
                style={{ color: 'var(--color-editorial-charcoal)', opacity: 0.3 }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-family-vazirmatn)',
                  color: 'var(--color-editorial-taupe)',
                }}
              >
                {t('common.loading', 'در حال بارگذاری...')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Ready Modal */}
      <DownloadReadyModal
        isOpen={state.showDownloadReady}
        onConfirm={state.handleConfirmDownload}
        onCancel={state.handleCancelDownload}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={state.isAuthModalOpen}
        onClose={() => {
          if (state.isLoggedIn) state.setIsAuthModalOpen(false);
          else state.navigate('/studio/upload');
        }}
        onSuccess={(user, tokens) => {
          state.login(user, tokens);
          state.setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
