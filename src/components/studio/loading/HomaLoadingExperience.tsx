import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { buildDiscoveryReview, type AnalysisPreview } from '@/pages/RoomRedesign/services/discoveryReview';
import type { ExecutionPlan } from '@/pages/RoomRedesign/services/redesignChatService';
import { loadingDecisions, loadingMoment, loadingSlides, type LoadingMoment } from './loadingState';
import { loadingAssets, SampleComparison } from './SampleComparison';
import './loading-v5.css';

export interface HomaLoadingProps {
  jobId: string; originalImage: string | null; analysis?: AnalysisPreview | null;
  analysisReady?: boolean; plan?: ExecutionPlan | null; busy: boolean;
  stageKey?: string | null; statusLabel?: string | null; error: string | null;
  complete: boolean; onComplete: () => void; onRetry: () => void;
  onNew?: () => void; onDiscuss?: () => void; tools?: ReactNode; panel?: ReactNode;
}

const narrative: Record<LoadingMoment, { micro: string; title: string; description: string }> = {
  comparison: { micro: 'DESIGN STUDY', title: 'هر تغییر خوب، با یک تصمیم درست شروع می‌شود.',
    description: 'در حال بررسی فضای تو هستیم. در این فاصله، نمونه‌ای از اثر تغییرات کوچک را ببین.' },
  moodboard: { micro: 'INSPIRATION / MATERIALS', title: 'جزئیات، حال‌وهوای فضا را می‌سازند.',
    description: 'این مودبرد، الهامی از رنگ، بافت و نور است؛ هنوز پالت اختصاصی فضای تو نیست.' },
  room: { micro: 'YOUR SPACE / INITIAL ANALYSIS', title: 'حالا نوبت خانهٔ خودته.',
    description: 'تحلیل اولیه آماده است. از ویژگی‌های واقعی فضایت، به مسیر طراحی می‌رسیم.' },
  decisions: { micro: 'DESIGN DECISIONS', title: 'همه‌چیز قرار نیست تغییر کند.',
    description: 'تصمیم‌های طراحی می‌توانند حفظ، جابه‌جایی یا تغییر باشند؛ خرید، تنها راه بهترشدن فضا نیست.' },
  finishing: { micro: 'FINALIZING YOUR DESIGN', title: 'پیشنهاد اختصاصی تو در حال تکمیل است.',
    description: 'تا آماده‌شدن واقعی خروجی همین‌جا می‌مانیم. نیازی به فرستادن دوبارهٔ درخواست نیست.' },
};

function Moodboard({ active }: { active: boolean }) {
  const { siteText: copy } = useSiteTranslation();
  return <figure className="homa-loading-board">
    <img className="homa-loading-board-hero" src={loadingAssets.editorial} alt={copy('فضای الهام‌بخش نمونه؛ ترکیب نور و متریال')} width={1000} height={667} loading={active ? 'eager' : 'lazy'} />
    <div className="homa-loading-board-stack">
      {[['after', 'نورپردازی نمونه'], ['after', 'بافت پارچه در نمونه'], ['editorial', 'جزئیات متریال نمونه']].map(([asset, alt], index) =>
        <img key={index} src={loadingAssets[asset as keyof typeof loadingAssets]} alt={copy(alt)} loading="lazy" />)}
    </div>
    <figcaption className="sr-only">{copy('الهام تصویری؛ رنگ، بافت و نور')}</figcaption>
  </figure>;
}

/** Production job shell. Timers rotate inspiration, never complete work or fabricate analysis. */
export function HomaLoadingExperience(props: HomaLoadingProps) {
  return <LoadingJob key={props.jobId} {...props} />;
}

function LoadingJob({ originalImage, analysis = null, analysisReady = false, plan = null, busy, stageKey,
  statusLabel, error, complete, onComplete, onRetry, onNew, onDiscuss, tools, panel }: HomaLoadingProps) {
  const { siteText: copy } = useSiteTranslation();
  const [introduction, setIntroduction] = useState<'comparison' | 'moodboard' | 'complete'>('comparison');
  const [extended, setExtended] = useState(false);
  const [findingIndex, setFindingIndex] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [paused, setPaused] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const body = useRef<HTMLDivElement>(null);
  const readyTitle = useRef<HTMLHeadingElement>(null);
  const completed = useRef(false);
  const completion = useRef(onComplete); completion.current = onComplete;
  const review = useMemo(() => buildDiscoveryReview(plan, analysis), [plan, analysis]);
  const decisions = useMemo(() => loadingDecisions(plan), [plan]);
  const slides = useMemo(() => loadingSlides(review, decisions), [review, decisions]);
  const hasAnalysis = analysisReady || !!analysis || !!plan;
  const ready = complete && !busy && !error;
  useEffect(() => {
    if (error || complete || !busy) return;
    const timer = window.setTimeout(() => setIntroduction('moodboard'), 8000);
    return () => window.clearTimeout(timer);
  }, [error, complete, busy]);
  // Moodboard is always the second visual; readiness merely permits leaving it.
  useEffect(() => {
    if (error || !hasAnalysis || introduction !== 'moodboard') return;
    const timer = window.setTimeout(() => setIntroduction('complete'), 1800);
    return () => window.clearTimeout(timer);
  }, [error, hasAnalysis, introduction]);
  useEffect(() => {
    if (!busy || error) return;
    const timer = window.setTimeout(() => setExtended(true), 120000);
    return () => window.clearTimeout(timer);
  }, [busy, error]);
  useEffect(() => {
    if (ready) { body.current?.setAttribute('inert', ''); readyTitle.current?.focus({ preventScroll: true }); }
    else body.current?.removeAttribute('inert');
  }, [ready]);
  useEffect(() => setPhotoFailed(false), [originalImage]);
  const moment = loadingMoment({ introduction, analysisReady: hasAnalysis,
    photoAvailable: !!originalImage && !photoFailed, hasPlan: !!plan, stageKey });
  // Keep the user's room and its findings visible while the renderer runs.
  const personal = introduction === 'complete' && hasAnalysis && !!originalImage && !photoFailed;
  const index = Math.min(findingIndex, Math.max(0, slides.length - 1));
  const slide = slides[index];
  useEffect(() => {
    if (!personal || paused || ready || error || index >= slides.length - 1) return;
    const timer = window.setTimeout(() => setFindingIndex(index + 1), 7000);
    return () => window.clearTimeout(timer);
  }, [personal, paused, ready, error, index, slides.length]);
  const openResult = () => { if (!completed.current) { completed.current = true; completion.current(); } };
  const status = error ? copy('این مرحله کامل نشد.') : statusLabel || copy(
    !busy && !complete ? 'پاسخ این مرحله آماده است؛ گفت‌وگو را بررسی کن.'
      : !hasAnalysis ? 'در حال شناخت و تحلیل فضا…' : !plan ? 'در حال طراحی تغییرات…'
        : stageKey === 'render' ? 'در حال آماده‌سازی خروجی طراحی…' : 'در حال یافتن محصولات متناسب…');
  const story = narrative[moment];
  const retry = () => { completed.current = false; setExtended(false); setIntroduction('comparison'); onRetry(); };
  return <div className="homa-loading-page" dir="rtl">
    <main className="homa-loading-screen" aria-label={copy('روند طراحی فضای شما')} aria-busy={busy && !error} data-moment={moment} data-personal={personal}>
      <div ref={body} className="homa-loading-body" aria-hidden={ready}>
      <header className="homa-loading-head"><div><div className="homa-loading-logo">HOMA</div><div className="homa-loading-micro">DESIGN IN PROGRESS</div></div>
        <div className="homa-loading-head-actions">{onDiscuss && <button type="button" onClick={onDiscuss}>{copy('گفت‌وگو')}</button>}
          {tools && <details><summary>{copy('گزینه‌ها')}</summary><div className="homa-loading-tools">{tools}</div></details>}</div>
      </header>
      <div className="homa-loading-top">
        <div className="homa-loading-eyebrow"><span>{story.micro}</span><span>{personal ? 'YOUR PROJECT' : 'HOMA STUDIO'}</span></div>
        <div className="homa-loading-visual">
          <section className="homa-loading-layer" data-active={moment === 'comparison'} aria-hidden={moment !== 'comparison'}>
            <SampleComparison active={moment === 'comparison' && !error} />
          </section>
          <section className="homa-loading-layer" data-active={!personal && (moment === 'moodboard' || moment === 'finishing')} aria-hidden={personal || (moment !== 'moodboard' && moment !== 'finishing')}>
            <Moodboard active={!personal && (moment === 'moodboard' || moment === 'finishing')} />
          </section>
          {hasAnalysis && originalImage && !photoFailed && personal && <section className="homa-loading-layer homa-loading-personal" data-active="true">
            <AuthenticatedImage src={originalImage} alt={copy('عکس اصلی فضای شما')} onError={() => setPhotoFailed(true)} />
          </section>}
        </div>
        <div className="homa-loading-photo-label">{copy(personal ? 'عکس اصلی فضای شما' : moment === 'comparison' ? 'پروژهٔ نمونه؛ نتیجهٔ فضای شما نیست' : 'الهام تصویری نمونه')}</div>
        <div className="homa-loading-copy">
          <div className="homa-loading-status" role="status" aria-live="polite"><i aria-hidden="true" data-running={busy && !error} /><span>{status}</span></div>
          <h1>{copy(error ? 'این مرحله کامل نشد.' : story.title)}</h1>
          <p className="homa-loading-description">{error || copy(story.description)}</p>
          {!error && <div className="homa-loading-detail">
            {moment === 'comparison' && <div className="homa-loading-note"><span aria-hidden="true">01</span><p><b>{copy('یک تغییر، بدون بازسازی کامل')}</b>{copy('نمونه‌ای از اثر هماهنگی روتختی، نور و استایلینگ روی فضای موجود.')}</p></div>}
            {moment === 'moodboard' && <div className="homa-loading-swatches" aria-label={copy('جزئیات مودبرد نمونه')}>
              {['editorial', 'after', 'editorial', 'after', 'editorial'].map((asset, index) => <img key={index} src={loadingAssets[asset as keyof typeof loadingAssets]} alt="" loading="lazy" />)}
            </div>}
            {personal && <div className="homa-loading-insight">
              <div className="homa-loading-insight-card" key={slide?.id || 'approach'} aria-live={paused ? 'polite' : 'off'}>
                <span>{copy(slide?.label || 'رویکرد هما')}</span>
                <p dir="auto">{slide?.observation || copy('عناصر مناسب حفظ می‌شوند؛ نیاز هر فضاست که مسیر تغییر را مشخص می‌کند.')}</p>
                {slide?.suggestion && <div className="homa-loading-insight-response"><b>{copy('پیشنهاد طراحی')}</b><p dir="auto">{slide.suggestion}</p></div>}
              </div>
              {slides.length > 1 && <nav className="homa-loading-insight-nav" aria-label={copy('مرور نکته‌های فضای شما')}>
                <button type="button" disabled={index === 0} onClick={() => { setPaused(true); setFindingIndex(index - 1); }}>{copy('نکتهٔ قبلی')}</button>
                <span>{(index + 1).toLocaleString('fa-IR')} / {slides.length.toLocaleString('fa-IR')}</span>
                <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{copy(paused ? 'ادامهٔ نمایش' : 'توقف نمایش')}</button>
                <button type="button" disabled={index === slides.length - 1} onClick={() => { setPaused(true); setFindingIndex(index + 1); }}>{copy('نکتهٔ بعدی')}</button>
              </nav>}
            </div>}
            {moment === 'finishing' && !personal && <div className="homa-loading-note"><span aria-hidden="true">03</span><p><b>{copy('آماده‌سازی نتیجه')}</b>{copy('طرح و پیشنهادها پس از آماده‌شدن واقعی، همین‌جا باز می‌شوند.')}</p></div>}
          </div>}
          {error && <>
            {(review.summary || review.direction || review.findings.length > 0) && <div className="homa-loading-insight"><span>{copy('تحلیل و پیشنهادهای آماده محفوظ‌اند')}</span>
              <p dir="auto">{review.summary || review.direction || review.findings[0]?.observation || review.findings[0]?.suggestion}</p>
            </div>}
            <div className="homa-loading-error" role="alert"><button type="button" onClick={retry} disabled={busy}>{copy('تلاش دوباره')}</button>
              {plan && <button type="button" onClick={onComplete}>{copy('دیدن پیشنهادهای آماده')}</button>}
              {onNew && <button type="button" onClick={onNew}>{copy('طراحی جدید')}</button>}</div>
          </>}
          {!busy && !error && !complete && onDiscuss && <button className="homa-loading-discuss" type="button" onClick={onDiscuss}>{copy('بازکردن گفت‌وگو')}</button>}
        </div>
      </div>
      <footer className="homa-loading-bottom">
        <div className="homa-loading-indicator" aria-hidden="true" data-running={busy && !error}><span /></div>
        <div className="homa-loading-footer-row"><span>{copy(error ? 'می‌توانی همین درخواست را دوباره بررسی کنی.' : hasAnalysis ? 'از شناخت فضا تا یک تغییر حساب‌شده' : 'در حال شناخت فضای شما')}</span><span>HOMA STUDIO</span></div>
        <p role={extended ? 'status' : undefined}>{copy(extended ? 'در حال تکمیل طراحی شما هستیم؛ این بار کمی بیشتر زمان می‌برد.' : 'نیازی به بارگذاری دوبارهٔ عکس نیست.')}</p>
      </footer>
      </div>
      {ready && <section className="homa-loading-ready" role="dialog" aria-modal="true" aria-labelledby="homa-loading-ready-title">
        <div className="homa-loading-ready-logo">HOMA</div><div className="homa-loading-ready-rule" aria-hidden="true" />
        <h2 ref={readyTitle} id="homa-loading-ready-title" tabIndex={-1}>{copy('طرح فضای تو آماده است.')}</h2>
        <p>{copy('حالا نتیجهٔ طراحی و پیشنهادهای متناسب با فضایت را ببین.')}</p>
        <button type="button" onClick={openResult}>{copy('دیدن طرح من')}<span aria-hidden="true">←</span></button>
      </section>}
    </main>{panel}
  </div>;
}
