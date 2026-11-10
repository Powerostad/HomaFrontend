import { useEffect, useRef, useState, type ReactNode } from 'react';
import { HomaLoadingExperience } from '@/components/studio/loading/HomaLoadingExperience';
import { useSiteTranslation } from '@/i18n/siteCopy';
import type { ExecutionPlan } from '../services/redesignChatService';
import type { AnalysisPreview } from '../services/discoveryReview';
import { journeySeen, markJourneyPending, prepareResultImages } from '../services/resultJourney';

/** Existing job owner and route remain unchanged; presentation only. */
export function StudioDiscovery({ plan, analysisPreview, originalImage, sessionId, busy, error,
  resultAvailable, autoRevealImage, onRetry, onComplete, onNew, onDiscuss, panel, tools, stage, stageKey }: {
  plan: ExecutionPlan | null; originalImage: string | null; sessionId: string | null; busy: boolean; error: string | null;
  resultAvailable: boolean; autoRevealImage?: string | null; stage?: string | null; stageKey?: string | null; analysisPreview?: AnalysisPreview | null;
  onRetry: () => void; onComplete: (automatic?: boolean) => void; onNew: () => void; onDiscuss: () => void; panel?: ReactNode; tools?: ReactNode;
}) {
  const { siteText: copy } = useSiteTranslation();
  const [assetError, setAssetError] = useState(false);
  const [retryImages, setRetryImages] = useState(0);
  const callback = useRef(onComplete); callback.current = onComplete;
  useEffect(() => { if (busy && sessionId) markJourneyPending(sessionId); }, [busy, sessionId]);
  const readyForReveal = !!autoRevealImage && resultAvailable && !busy && !!plan && !error && !!originalImage;
  useEffect(() => {
    if (!readyForReveal) return;
    const controller = new AbortController();
    setAssetError(false);
    void prepareResultImages([originalImage!, autoRevealImage!], controller.signal).then(() => {
      if (!controller.signal.aborted) callback.current(!journeySeen(sessionId || 'new'));
    }, () => { if (!controller.signal.aborted) setAssetError(true); });
    return () => controller.abort();
  }, [readyForReveal, autoRevealImage, originalImage, sessionId, retryImages]);
  return <HomaLoadingExperience jobId={sessionId || 'new'} originalImage={originalImage} analysis={analysisPreview}
    plan={plan} busy={busy || (readyForReveal && !assetError)} error={error || (assetError ? copy('تصویر طرح هنوز بارگذاری نشده؛ می‌توانی دوباره عکس را بررسی کنی یا پیشنهادهای آماده را ببینی.') : null)}
    complete={(!autoRevealImage || !originalImage) && !busy && !!plan && !error}
    stageKey={stageKey || (resultAvailable ? 'finalize' : undefined)} statusLabel={readyForReveal ? copy('طرح آماده است؛ در حال بارگذاری عکس‌های قبل و بعد…') : stage}
    onRetry={assetError ? () => setRetryImages(value => value + 1) : onRetry} onComplete={() => onComplete(false)} onNew={onNew} onDiscuss={onDiscuss} panel={panel} tools={tools} />;
}
