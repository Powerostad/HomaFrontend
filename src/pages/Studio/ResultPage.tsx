import { trackStudioResultAction } from '@/analytics/events';
import { Header } from '@/components/Header';
import { InlineFeedbackWidget } from '@/components/InlineFeedbackWidget';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Bookmark, ChevronDown, Download as DownloadIcon, Loader2, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudioProductSheet } from './result/StudioProductSheet';
import { CollectionSummary } from './result/CollectionSummary';
import { ActionRecommendationCard } from './result/ActionRecommendationCard';
import { CompletionChecklist } from './result/CompletionChecklist';
import type { DiagnosisAction } from './result/DiagnosisActionCard';
import { DownloadReadyModal } from './result/DownloadReadyModal';
import { ExitDecisionModal } from './result/ExitDecisionModal';
import { FullscreenOverlay } from './result/FullscreenOverlay';
import { DesktopHeroPanel, MobileHeroSection } from './result/HeroImagePanel';
import { ImpactProgressCard } from './result/ImpactProgressCard';
import { InvoiceSummary } from './result/InvoiceSummary';
import { SpatialDiagnosis } from './result/SpatialDiagnosis';
import { StudioPrintReport } from './result/StudioPrintReport';
import './result/studio-result.css';
import './result/studio-workspace.css';
import './result/studio-product-layout.css';
import { TierSection } from './result/TierSection';
import type { CompletionChecklistItem } from './result/types';
import { useSimpleTranslation } from './result/types';
import { UnifiedConsultationCTA } from './result/UnifiedConsultationCTA';
import { useStudioResult } from './result/useStudioResult';
import type { StudioResultConversation, StudioResultViewState } from './result/viewState';

import { journeySeen, markJourneySeen, type JourneyFinding } from '../RoomRedesign/services/resultJourney';
import { AnalysisGuide, ResultReveal } from './result/IntegratedResultJourney';

type Phase = 'analysis' | 'recommendations' | 'basket';

const FONT = 'var(--font-family-vazirmatn)';

export function StudioResultPage() {
  const state = useStudioResult();
  return <StudioResultView state={state} />;
}

export function StudioResultView({ state, conversation, journey }: { state: StudioResultViewState; conversation?: StudioResultConversation; journey?: { key: string; start: boolean; findings: JourneyFinding[] } }) {
  const { siteValue, siteDirection, siteText } = useSiteTranslation();
  const { t } = useSimpleTranslation();
  const [activePhase, setActivePhase] = useState<Phase>('recommendations');
  const [linkCopied, setLinkCopied] = useState(false);
  const [journeyPhase, setJourneyPhase] = useState<'reveal' | 'guide' | 'recommendations'>(() =>
    journey?.start && !journeySeen(journey.key) && !state.analysisOnly && state.originalImage ? 'reveal' : 'recommendations');
  const revealing = journeyPhase === 'reveal';
  const [guideRequested, setGuideRequested] = useState(false);
  useEffect(() => { if (revealing && journey) markJourneySeen(journey.key); }, [revealing, journey]);

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
      impactKnown: group.impactKnown,
    })),
    [state.categoryGroups, t],
  );

  const tierStepOffsets: number[] = [];
  let runningStep = 0;
  const productTierGroups = state.tierGroups.map(group => ({ ...group, items: group.items.filter(item => item.actionStatus === 'available') })).filter(group => group.items.length > 0);
  const layoutItems = state.categoryGroups.filter(group => group.actionKind === 'layout');
  const serviceItems = state.categoryGroups.filter(group => group.actionStatus === 'architectural' && group.actionKind !== 'layout');
  for (const { items } of productTierGroups) {
    tierStepOffsets.push(runningStep);
    runningStep += items.length;
  }

  const purchasableCount = state.categoryGroups.filter(
    (group) => group.actionStatus === 'available' && group.products.length > 0,
  ).length;

  const checklistItems: CompletionChecklistItem[] = state.completionChecklistItems.filter(group => group.actionStatus === 'custom_order').map((group) => ({
    id: group.itemId,
    name: group.categoryDisplay,
    category: group.category,
    imageUrl: group.products[0]?.image || '',
    aiReasoning: group.recommendationReasonFa || group.designRationaleFa,
    webSearchQuery: group.webSearchQuery, specifications: group.sourcingSpecs,
  }));

  const handlePhaseClick = useCallback((phase: Phase) => {
    conversation?.onClose?.();
    if (revealing) { setJourneyPhase('recommendations'); state.setShowOriginal(false); }
    setActivePhase(phase);
    trackStudioResultAction({
      action: 'phase_navigation',
      session_id: state.sessionId || state.activeSessionId || '',
      phase,
    });
    requestAnimationFrame(() => document.getElementById(`section-${phase === 'recommendations' ? 'products' : phase}`)?.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    }));
  }, [state.activeSessionId, state.sessionId, state.setShowOriginal, conversation, revealing]);

  const finishGuide = (productKey?: string) => {
    setJourneyPhase('recommendations'); setGuideRequested(false); state.setShowOriginal(false);
    if (journey) markJourneySeen(journey.key);
    handlePhaseClick('recommendations');
    requestAnimationFrame(() => {
      const group = productKey ? state.categoryGroups.find(item => item.workspaceKey === productKey) : null;
      if (group) state.scrollToCard(group.itemId);
      else {
        const section = document.getElementById('section-products');
        section?.setAttribute('tabindex', '-1'); section?.focus({ preventScroll: true });
      }
    });
  };
  const finishReveal = () => {
    state.setShowOriginal(false);
    if (journey?.findings.length) setJourneyPhase('guide'); else finishGuide();
  };
  const handleMarkerClick = useCallback((itemId: number) => {
    setActivePhase('recommendations');
    requestAnimationFrame(() => state.handleImageMarkerClick(itemId));
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
    onExit: conversation?.onExit || (() => state.setShowExitDecision(true)),
    onMarkerClick: handleMarkerClick,
    onImageError: conversation?.onImageError,
    showActions: false,
  };

  return (
    <div
      className={`studio-result-page${conversation ? ' studio-result-with-conversation' : ''}`}
      dir={siteDirection()}
      data-revealing={revealing}
      style={{ fontFamily: FONT }}
    >
      {siteValue(!state.isFullScreen && <Header hideSpacer />)}

      <main className="studio-result-main" dir="ltr">
        <section className="studio-result-hero" aria-label={t('studio.result.v2.hero.title', 'تصویر نتیجه طراحی')}>
          {revealing && state.originalImage ? <ResultReveal before={state.originalImage} after={state.resultImage} onComplete={finishReveal} /> : <><DesktopHeroPanel {...heroProps} /><MobileHeroSection {...heroProps} /></>}
        </section>

        <section className="studio-result-content" dir={siteDirection()} data-chat-open={!!conversation?.open && !conversation.compact}>
          <nav className="studio-workspace-nav" aria-label={t('studio.result.v2.phase.label', 'مراحل نتیجه')}>
            {(['recommendations', 'analysis', 'basket'] as const).map(phase => <button type="button" key={phase} aria-current={!conversation?.open && activePhase === phase ? 'page' : undefined} onClick={() => handlePhaseClick(phase)}>{t(`studio.result.v2.phase.${phase}`, phase)}</button>)}
            {conversation && <button type="button" aria-current={conversation.open ? 'page' : undefined} onClick={conversation.onOpen}><MessageSquare size={16} />{t('studioWorkspace.conversation', 'گفتگو')}</button>}
          </nav>
          {conversation?.panel}
          <div className="studio-result-report" hidden={!!conversation?.open && !conversation.compact}>
          <div className="studio-result-heading">
            <div>
              <p className="studio-result-eyebrow">
                {siteValue(state.analysisOnly
                  ? t('studio.result.v2.analysisOnly.label', 'تحلیل اولیه فضا')
                  : t('studio.result.v2.title', 'نتیجه طراحی'))}
              </p>
              <h1>
                {siteValue(state.projectName || t('studio.result.v2.roomFallback', 'فضای شما'))}
                {siteValue(state.targetStyle && <span className="studio-result-heading-style">، {siteValue(state.targetStyle)}</span>)}
              </h1>
              {!conversation && <p className="studio-result-heading-description">
                {t('studio.result.v2.headingDescription', 'سه تغییر هماهنگ برای تبدیل ظرفیت فضا به یک انتخاب روشن و قابل اجرا.')}
              </p>}
            </div>
            <details className="studio-result-more">
              <summary>{t('studioProductLayout.more', 'بیشتر')}<ChevronDown size={16} aria-hidden="true" /></summary>
              <div className="studio-result-more-content">
                <StudioPrintReport state={state} review={conversation?.printReview} busy={conversation?.busy} />
                <Button variant="outline" onClick={() => state.setIsSaved(!state.isSaved)} aria-pressed={state.isSaved}><Bookmark size={16} aria-hidden="true" />{t(state.isSaved ? 'studio.result.v2.saved' : 'common.save', state.isSaved ? 'ذخیره شده' : 'ذخیره')}</Button>
                {!state.analysisOnly && <Button variant="outline" onClick={state.handleDownload} disabled={state.isDownloading}><DownloadIcon size={16} aria-hidden="true" />{t('common.download', 'دانلود')}</Button>}
                <Button variant="outline" onClick={async () => {
                  try {
                    if (navigator.share) await navigator.share({ title: state.projectName, url: window.location.href });
                    else { await navigator.clipboard.writeText(window.location.href); setLinkCopied(true); }
                  } catch { /* Cancelled or unavailable sharing leaves the design unchanged. */ }
                }}><Share2 size={16} aria-hidden="true" />{linkCopied ? t('common.copied', 'کپی شد') : t('common.share', 'اشتراک‌گذاری')}</Button>
                {conversation?.toolbar}
              </div>
            </details>
          </div>
          {conversation?.status}

          <section id="section-analysis" className="studio-result-section" aria-labelledby="analysis-title" hidden={activePhase !== 'analysis'}>
            {journey && (journey.findings.length ? <button className="studio-result-guide-replay" type="button" onClick={() => setGuideRequested(true)}>{siteText('مرور مرحله‌به‌مرحلهٔ تصمیم‌های طراحی')}</button> : <p>{siteText('برای این طرح، تحلیل تفصیلی ثبت نشده است.')}</p>)}
            <h2 id="analysis-title" className="sr-only">
              {t('studio.result.v2.diagnosis.label', 'تحلیل فضا')}
            </h2>

            {siteValue(state.analysisOnly && !conversation && (
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
                  {siteValue(state.isRequestingRedesignCredit
                    ? t('studio.result.v2.analysisOnly.requesting', 'در حال ثبت درخواست...')
                    : t('studio.result.v2.analysisOnly.request', 'درخواست تولید تصویر بازطراحی'))}
                </button>
              </div>
            ))}

            {(!conversation || state.harmonyScore != null) && <ImpactProgressCard
              currentScore={state.harmonyScore}
              liveProjectedScore={state.liveProjectedScore}
              maxProjectedScore={state.projectedScore}
              acceptedCount={state.acceptedItems.size}
              totalCount={state.categoryGroups.length}
            />}

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
              onScrollToStep={handleMarkerClick}
              onNavigateToRecommendations={() => handlePhaseClick('recommendations')}
              detailsContent={conversation?.details}
              priceUnknown={conversation?.priceUnknown}
            />
          </section>

          <section id="section-products" className="studio-result-section" aria-labelledby="products-title" hidden={activePhase !== 'recommendations'}>
            <div className="studio-section-heading">
              <div>
                <p className="studio-result-eyebrow">{t('studio.result.v2.phase.recommendations', 'پیشنهادها')}</p>
                <h2 id="products-title">{t('studioProductLayout.title', 'محصولات پیشنهادی')}</h2>
              </div>
              <span className="studio-count-badge">{siteValue(purchasableCount)}</span>
            </div>

            {siteValue(productTierGroups.map(({ tier, items }, tierIndex) => (
              <TierSection
                key={tier}
                hideHeading
                tier={tier}
                items={items}
                allCategoryGroups={state.categoryGroups}
                onMakePrimary={state.makePrimaryProduct}
                stepStartIndex={tierStepOffsets[tierIndex] || 0}
                priorityRankedIds={state.priorityRankedIds}
                expandedWhyGroups={state.expandedWhyGroups}
                acceptedItems={state.acceptedItems}
                basketProductIds={state.basketProductIds}
                isSaved={state.isSaved}
                sessionId={state.sessionId ?? state.activeSessionId ?? undefined}
                onToggleWhy={state.toggleWhyExpanded}
                onProductClick={state.handleProductClick}
                onRefineProduct={conversation?.onRefineProduct}
                busy={conversation?.busy}
                onToggleSaved={() => state.setIsSaved(!state.isSaved)}
                onToggleAccepted={state.toggleAcceptedItem}
                onToggleBasketProduct={state.toggleBasketProduct}
                onScrollToAnalysis={() => handlePhaseClick('analysis')}
                onUpdateQuantity={(itemId, quantity) => state.updateItemQuantity(itemId, quantity)}
              />
            )))}

            {siteValue(state.categoryGroups.length === 0 && (
              <div className="studio-empty-state">
                <p>{t('studio.result.v2.noRecommendations', 'هنوز پیشنهادی برای این جلسه آماده نشده است.')}</p>
              </div>
            ))}

            <CompletionChecklist key={state.sessionId || state.activeSessionId || 'draft'} sessionId={state.sessionId || state.activeSessionId || undefined}
              items={checklistItems}
              checkedIds={state.checklistCheckedIds}
              onToggleItem={state.toggleChecklistItem}
            />

            {[
              { key: 'layout', title: 'بهبود چیدمان', items: layoutItems },
              { key: 'services', title: 'خدمات اجرایی و تغییرات کالبدی', items: serviceItems },
            ].map(section => section.items.length > 0 && <section key={section.key} className="studio-action-section" aria-labelledby={`studio-${section.key}-title`}>
              <div className="studio-tier-heading"><h3 id={`studio-${section.key}-title`}>{siteValue(section.title)}</h3><span>{siteValue(section.items.length)}</span></div>
              {section.items.map(group => <ActionRecommendationCard key={group.itemId} group={group} selected={state.acceptedItems.has(group.itemId)} onToggle={() => state.toggleAcceptedItem(group.itemId)} />)}
            </section>)}

            {(serviceItems.some(item => state.acceptedItems.has(item.itemId)) || checklistItems.some(item => state.checklistCheckedIds.has(item.id))) && <UnifiedConsultationCTA
              serviceItems={serviceItems}
              acceptedServiceIds={state.acceptedItems}
              sourcingItems={checklistItems}
              checkedSourcingIds={state.checklistCheckedIds}
            />}
          </section>

          <div id="section-basket" ref={basketSectionRef} className="studio-result-section studio-result-basket-section" hidden={activePhase !== 'basket'}>
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
              {!conversation && <InlineFeedbackWidget flow="studio" sessionId={state.activeSessionId || state.sessionId} />}
            </div>
          </div>
          {conversation?.afterReport}
          </div>
        </section>
      </main>

      {(journeyPhase === 'guide' || guideRequested) && journey && <AnalysisGuide findings={journey.findings} image={state.resultImage} onClose={() => finishGuide()} onProduct={key => finishGuide(key)} />}
      <CollectionSummary
        activePhase={activePhase}
        onNavigateToPhase={handlePhaseClick}
        selectedPrice={state.selectedPrice}
        selectedCount={state.selectedCount}
        totalCount={purchasableCount}
        totalRecommendations={state.categoryGroups.length}
        isAtBasket={activePhase === 'basket'}
        onOpenChat={conversation?.onOpen}
        chatOpen={conversation?.open}
      />

      <AnimatePresence>
        {siteValue(state.isFullScreen && !state.analysisOnly && (
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
        ))}
      </AnimatePresence>

      {siteValue(state.selectedProduct && (
        <StudioProductSheet
          product={state.selectedProduct}
          isOpen
          onClose={() => state.setSelectedProduct(null)}
          onRefineProduct={conversation?.onRefineProduct}
          onMakePrimary={() => {
            const group = state.categoryGroups.find(item => item.products.some(product => product.id === state.selectedProduct!.id));
            if (group) state.makePrimaryProduct(group.itemId, state.selectedProduct!.id);
            state.setSelectedProduct(null);
          }}
          isAlternative={state.categoryGroups.some(group => group.products.slice(1).some(product => product.id === state.selectedProduct!.id))}
          isInBasket={state.basketProductIds.has(state.selectedProduct.id)}
          onToggleBasket={() => state.toggleBasketProduct(state.selectedProduct!.id)}
          onPreview={conversation ? () => { const product = state.selectedProduct; state.setSelectedProduct(null); if (product) conversation.onPreview(product); } : undefined}
          previewBusy={conversation?.busy}
        />
      ))}

      <AnimatePresence>
        {siteValue(state.showExitDecision && (
          <ExitDecisionModal
            onConfirm={() => { state.setIsSaved(true); state.setShowExitDecision(false); state.navigate('/studio'); }}
            onCancel={() => state.setShowExitDecision(false)}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {siteValue(state.isLoading && (
          <div className="studio-loading-overlay" role="status" aria-live="polite">
            <Loader2 className="animate-spin" size={32} />
            <span>{t('common.loading', 'در حال بارگذاری...')}</span>
          </div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {siteValue(state.showDownloadReady && (
          <DownloadReadyModal onConfirm={state.handleConfirmDownload} onCancel={state.handleCancelDownload} />
        ))}
      </AnimatePresence>
    </div>
  );
}
