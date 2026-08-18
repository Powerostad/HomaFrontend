import { AnimatePresence } from 'motion/react';
import { Bookmark, Download as DownloadIcon, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { InlineFeedbackWidget } from '@/components/InlineFeedbackWidget';
import { ProductDetailSheet } from './components/ProductDetailSheet';
import { useSimpleTranslation } from './result/types';
import type { DiagnosisAction } from './result/DiagnosisActionCard';
import type { CompletionChecklistItem } from './result/types';
import { useStudioResult } from './result/useStudioResult';
import { ImpactProgressCard } from './result/ImpactProgressCard';
import { SpatialDiagnosis } from './result/SpatialDiagnosis';
import { TierSection } from './result/TierSection';
import { CollectionSummary } from './result/CollectionSummary';
import { InvoiceSummary } from './result/InvoiceSummary';
import { DesktopHeroPanel, MobileHeroSection } from './result/HeroImagePanel';
import { FullscreenOverlay } from './result/FullscreenOverlay';
import { ExitDecisionModal } from './result/ExitDecisionModal';
import { DownloadReadyModal } from './result/DownloadReadyModal';
import { CompletionChecklist } from './result/CompletionChecklist';
import { UnifiedConsultationCTA } from './result/UnifiedConsultationCTA';
import { trackStudioResultAction } from '@/analytics/events';
import './result/studio-result.css';

type Phase = 'analysis' | 'recommendations' | 'basket';

const FONT = 'var(--font-family-vazirmatn)';

export function StudioResultPage() {
  const { t } = useSimpleTranslation();
  const state = useStudioResult();
  const [activePhase, setActivePhase] = useState<Phase>('analysis');
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const basketSectionRef = useRef<HTMLDivElement>(null);

  const diagnosisActions = useMemo<DiagnosisAction[]>(
    () => state.categoryGroups.map((group) => ({
      id: group.itemId,
      status: group.impactLevel === 'high'
        ? 'critical'
        : group.impactLevel === 'medium'
          ? 'warning'
          : 'good',
      title: group.categoryDisplay,
      diagnosis: group.recommendationReasonFa || t('studio.result.v2.diagnosis.defaultProblem', 'این بخش از فضا به توجه بیشتری نیاز دارد.'),
      solution: group.designRationaleFa || t('studio.result.v2.diagnosis.defaultSolution', 'یک تغییر هماهنگ با سبک و مقیاس فضا.'),
      ctaText: t('studio.result.v2.card.viewRecommendation', 'مشاهده پیشنهاد'),
      linkedItemId: group.itemId,
      harmonyImpact: group.impactLevel === 'high' ? 80 : group.impactLevel === 'medium' ? 50 : 30,
      iconType: 'default',
      placements: group.placements,
    })),
    [state.categoryGroups, t],
  );

  const tierStepOffsets: number[] = [];
  let runningStep = 0;
  for (const { items } of state.tierGroups) {
    tierStepOffsets.push(runningStep);
    runningStep += items.length;
  }

  const purchasableCount = state.categoryGroups.filter(
    (group) => group.actionStatus === 'available' && group.products.length > 0,
  ).length;

  const checklistItems: CompletionChecklistItem[] = state.completionChecklistItems.map((group) => ({
    id: group.itemId,
    name: group.categoryDisplay,
    category: group.category,
    imageUrl: group.products[0]?.image || '',
    aiReasoning: group.recommendationReasonFa || group.designRationaleFa,
  }));

  useEffect(() => {
    const updateScrollState = () => {
      const basket = basketSectionRef.current;
      if (!basket) return;

      const basketTop = basket.getBoundingClientRect().top;
      const viewportThreshold = window.innerHeight * 0.42;
      setIsBasketVisible(basketTop <= viewportThreshold && basket.getBoundingClientRect().bottom > 0);

      const recommendationSection = document.getElementById('section-products');
      if (basketTop <= viewportThreshold) {
        setActivePhase('basket');
      } else if (recommendationSection && recommendationSection.getBoundingClientRect().top <= viewportThreshold) {
        setActivePhase('recommendations');
      } else {
        setActivePhase('analysis');
      }
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [state.isInitialized, state.categoryGroups.length]);

  const handlePhaseClick = useCallback((phase: Phase) => {
    setActivePhase(phase);
    trackStudioResultAction({
      action: 'phase_navigation',
      session_id: state.sessionId || state.activeSessionId || '',
      phase,
    });
    document.getElementById(`section-${phase === 'recommendations' ? 'products' : phase}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [state.activeSessionId, state.sessionId]);

  const handleMarkerClick = useCallback((itemId: number) => {
    setActivePhase('recommendations');
    state.handleImageMarkerClick(itemId);
  }, [state.handleImageMarkerClick]);

  const markers = useMemo(
    () => state.categoryGroups.map((group, index) => ({
      itemId: group.itemId,
      label: group.categoryDisplay,
      marker: group.positionInImage,
      number: index + 1,
    })),
    [state.categoryGroups],
  );

  const heroProps = {
    resultImage: state.resultImage,
    originalImage: state.originalImage,
    showOriginal: state.showOriginal,
    isSaved: state.isSaved,
    isDownloading: state.isDownloading,
    analysisOnly: state.analysisOnly,
    sessionId: state.sessionId ?? state.activeSessionId ?? undefined,
    markers,
    onToggleOriginal: state.setShowOriginal,
    onToggleSaved: () => state.setIsSaved(!state.isSaved),
    onDownload: state.handleDownload,
    onFullscreen: () => !state.analysisOnly && state.setIsFullScreen(true),
    onExit: () => state.setShowExitDecision(true),
    onMarkerClick: handleMarkerClick,
  };

  return (
    <div
      className="studio-result-page"
      dir="rtl"
      style={{ fontFamily: FONT }}
    >
      {!state.isFullScreen && <Header />}

      <main className="studio-result-main" dir="ltr">
        <section className="studio-result-hero" aria-label={t('studio.result.v2.hero.title', 'تصویر نتیجه طراحی')}>
          <DesktopHeroPanel {...heroProps} />
          <MobileHeroSection {...heroProps} />
        </section>

        <section className="studio-result-content" dir="rtl">
          <div className="studio-result-heading">
            <div>
              <p className="studio-result-eyebrow">
                {state.analysisOnly
                  ? t('studio.result.v2.analysisOnly.label', 'تحلیل اولیه فضا')
                  : t('studio.result.v2.title', 'نتیجه طراحی')}
              </p>
              <h1>
                {state.projectName || t('studio.result.v2.roomFallback', 'فضای شما')}
                {state.targetStyle && <span className="studio-result-heading-style">، {state.targetStyle}</span>}
              </h1>
              <p className="studio-result-heading-description">
                {t('studio.result.v2.headingDescription', 'سه تغییر هماهنگ برای تبدیل ظرفیت فضا به یک انتخاب روشن و قابل اجرا.')}
              </p>
            </div>
            <div className="studio-result-heading-actions" aria-label={t('studio.result.v2.actions', 'اقدامات نتیجه')}>
              <button
                type="button"
                className="studio-icon-button"
                onClick={() => state.setIsSaved(!state.isSaved)}
                aria-label={state.isSaved ? t('studio.result.v2.saved', 'ذخیره شده') : t('common.save', 'ذخیره')}
                aria-pressed={state.isSaved}
              >
                <Bookmark size={18} fill={state.isSaved ? 'currentColor' : 'none'} />
              </button>
              {!state.analysisOnly && (
                <button
                  type="button"
                  className="studio-icon-button"
                  onClick={state.handleDownload}
                  disabled={state.isDownloading}
                  aria-label={t('common.download', 'دانلود')}
                >
                  {state.isDownloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadIcon size={18} />}
                </button>
              )}
            </div>
          </div>

          <section id="section-analysis" className="studio-result-section" aria-labelledby="analysis-title">
            <h2 id="analysis-title" className="sr-only">
              {t('studio.result.v2.diagnosis.label', 'تحلیل فضا')}
            </h2>

            {state.analysisOnly && (
              <div className="studio-analysis-only-callout" role="status">
                <div>
                  <strong>{t('studio.result.v2.analysisOnly.title', 'این نتیجه، تحلیل اولیه فضای شماست')}</strong>
                  <p>{t('studio.result.v2.analysisOnly.description', 'برای این جلسه تصویر بازطراحی تولید نشده؛ پیشنهادها همچنان بر اساس عکس اصلی و تشخیص فضای شما ارائه شده‌اند.')}</p>
                </div>
                <button
                  type="button"
                  onClick={state.handleRequestRedesignCredit}
                  disabled={state.isRequestingRedesignCredit}
                  className="studio-secondary-button"
                >
                  {state.isRequestingRedesignCredit
                    ? t('studio.result.v2.analysisOnly.requesting', 'در حال ثبت درخواست...')
                    : t('studio.result.v2.analysisOnly.request', 'درخواست تولید تصویر بازطراحی')}
                </button>
              </div>
            )}

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
              totalPrice={state.recommendedTotalPrice}
              selectedPrice={state.selectedPrice}
              selectedCount={state.selectedCount}
              totalRecommendations={state.categoryGroups.length}
              diagnosisDetail={state.diagnosisDetail}
              diagnosisExpanded={state.diagnosisExpanded}
              onToggleDiagnosis={() => state.setDiagnosisExpanded(!state.diagnosisExpanded)}
              detectedContext={{
                roomType: state.projectName,
                targetStyle: state.targetStyle,
                naturalLight: '',
                dominantSurfaces: '',
              }}
              diagnosisActions={diagnosisActions}
              onScrollToStep={state.scrollToCard}
              onNavigateToRecommendations={() => handlePhaseClick('recommendations')}
            />
          </section>

          <section id="section-products" className="studio-result-section" aria-labelledby="products-title">
            <div className="studio-section-heading">
              <div>
                <p className="studio-result-eyebrow">{t('studio.result.v2.phase.recommendations', 'پیشنهادها')}</p>
                <h2 id="products-title">{t('studio.result.v2.recommendationsTitle', 'سه تغییر برای شروع')}</h2>
              </div>
              <span className="studio-count-badge">{state.categoryGroups.length} {t('studio.result.v2.changeCount', 'تغییر')}</span>
            </div>

            {state.tierGroups.map(({ tier, items }, tierIndex) => (
              <TierSection
                key={tier}
                tier={tier}
                items={items}
                allCategoryGroups={state.categoryGroups}
                stepStartIndex={tierStepOffsets[tierIndex] || 0}
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
                onScrollToAnalysis={() => handlePhaseClick('analysis')}
                onUpdateQuantity={(itemId, quantity) => state.updateItemQuantity(itemId, quantity)}
              />
            ))}

            {state.tierGroups.length === 0 && (
              <div className="studio-empty-state">
                <p>{t('studio.result.v2.noRecommendations', 'هنوز پیشنهادی برای این جلسه آماده نشده است.')}</p>
              </div>
            )}

            <CompletionChecklist
              items={checklistItems}
              checkedIds={state.checklistCheckedIds}
              onToggleItem={state.toggleChecklistItem}
            />

            <UnifiedConsultationCTA
              serviceItems={state.categoryGroups.filter(
                (group) => group.actionStatus === 'custom_order' || group.actionStatus === 'architectural',
              )}
              acceptedServiceIds={state.acceptedItems}
              sourcingItems={checklistItems}
              checkedSourcingIds={state.checklistCheckedIds}
            />
          </section>

          <div id="section-basket" ref={basketSectionRef} className="studio-result-section studio-result-basket-section">
            <InvoiceSummary
              categoryGroups={state.categoryGroups}
              acceptedItems={state.acceptedItems}
              basketProductIds={state.basketProductIds}
              selectedPrice={state.selectedPrice}
              onToggleAccepted={state.toggleAcceptedItem}
              onToggleBasketProduct={state.toggleBasketProduct}
              onFinalize={state.handleFinalize}
              isFinalizing={state.isFinalizing}
              onUpdateQuantity={state.updateItemQuantity}
              onUpdateProductQuantity={state.updateProductQuantity}
              productQuantityOverrides={state.productQuantityOverrides}
            />

            <div id="section-feedback" className="studio-result-feedback">
              <InlineFeedbackWidget flow="studio" sessionId={state.activeSessionId || state.sessionId} />
            </div>
          </div>
        </section>
      </main>

      <CollectionSummary
        activePhase={activePhase}
        onNavigateToPhase={handlePhaseClick}
        selectedPrice={state.selectedPrice}
        selectedCount={state.selectedCount}
        totalCount={purchasableCount}
        totalRecommendations={state.categoryGroups.length}
        isAtBasket={isBasketVisible}
      />

      <AnimatePresence>
        {state.isFullScreen && !state.analysisOnly && (
          <FullscreenOverlay
            resultImage={state.resultImage}
            originalImage={state.originalImage}
            showOriginal={state.showOriginal}
            isSaved={state.isSaved}
            isDownloading={state.isDownloading}
            onClose={() => state.setIsFullScreen(false)}
            onToggleOriginal={state.setShowOriginal}
            onToggleSaved={() => state.setIsSaved(!state.isSaved)}
            onDownload={state.handleDownload}
          />
        )}
      </AnimatePresence>

      {state.selectedProduct && (
        <ProductDetailSheet
          product={state.selectedProduct}
          isOpen
          onClose={() => state.setSelectedProduct(null)}
          onReplace={() => undefined}
          alternatives={state.productAlternatives}
          redesignSessionId={state.activeSessionId ?? state.sessionId}
          isInBasket={state.basketProductIds.has(state.selectedProduct.id)}
          onToggleBasket={() => state.toggleBasketProduct(state.selectedProduct!.id)}
          onSelectProduct={state.handleProductClick}
        />
      )}

      <AnimatePresence>
        {state.showExitDecision && (
          <ExitDecisionModal
            onConfirm={() => { state.setIsSaved(true); state.setShowExitDecision(false); state.navigate('/studio'); }}
            onCancel={() => state.setShowExitDecision(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isLoading && (
          <div className="studio-loading-overlay" role="status" aria-live="polite">
            <Loader2 className="animate-spin" size={32} />
            <span>{t('common.loading', 'در حال بارگذاری...')}</span>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.showDownloadReady && (
          <DownloadReadyModal onConfirm={state.handleConfirmDownload} onCancel={state.handleCancelDownload} />
        )}
      </AnimatePresence>
    </div>
  );
}
