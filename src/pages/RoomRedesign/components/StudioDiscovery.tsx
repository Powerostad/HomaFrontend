import { trackStudioResultAction } from '@/analytics/events';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ImageIcon, Loader2, MessageSquare, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ExecutionPlan } from '../services/redesignChatService';
import { buildDiscoveryReview, type DiscoveryTrack, type AnalysisPreview } from '../services/discoveryReview';
import '../discovery.css';
import { DiscoveryLoading } from './DiscoveryLoading';
import { InitialAnalysisLoading } from './InitialAnalysisLoading';
import { DiscoveryProgress, DiscoveryElapsed } from './DiscoveryProgress';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const trackLabels: Record<DiscoveryTrack, string> = {
  layout: 'چیدمان و تناسب', harmony: 'هماهنگی فضا', function: 'کارکرد روزمره', surfaces: 'نور و سطوح', idea: 'ایدهٔ تغییر',
};

function FindingText({ value, className = '' }: { value: string; className?: string }) {
  const { siteText: copy } = useSiteTranslation();
  const [expanded, setExpanded] = useState(false);
  const long = value.length > 160;
  return <div className="studio-discovery-copy"><p dir="auto" className={`${className}${long && !expanded ? ' studio-discovery-clamped' : ''}`}>{value}</p>
    {long && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(previous => !previous)}>{copy(expanded ? 'کمتر' : 'متن کامل')}</button>}
  </div>;
}

export function StudioDiscovery({ plan, analysisPreview, originalImage, sessionId, busy, error, resultAvailable, onRetry, onComplete, onNew, onDiscuss, panel, tools, stage }: {
  plan: ExecutionPlan | null; originalImage: string | null; sessionId: string | null; busy: boolean; error: string | null;
  resultAvailable: boolean;
  stage?: string | null;
  analysisPreview?: AnalysisPreview | null;
  onRetry: () => void; onComplete: () => void; onNew: () => void; onDiscuss: () => void; panel?: ReactNode; tools?: ReactNode;
}) {
  const { siteText: copy, siteDirection, siteLocale } = useSiteTranslation();
  const review = useMemo(() => buildDiscoveryReview(plan, analysisPreview), [plan, analysisPreview]);
  const hasAnalysis = !!plan || !!analysisPreview;
  const [findingId, setFindingId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [overviewRead, setOverviewRead] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const reading = useRef<HTMLDivElement>(null);
  const viewed = useRef(new Set<string>());
  const firstShown = useRef(false);
  const start = useRef(Date.now());
  const index = Math.max(0, review.findings.findIndex(finding => finding.id === findingId));
  const finding = review.findings[index];
  const completeAvailable = !!plan && !busy;
  const ready = completeAvailable && !error && resultAvailable;
  const last = index === review.findings.length - 1;
  const overview = !!review.summary && !overviewRead;
  const number = (value: number) => value.toLocaleString(siteLocale());
  useEffect(() => { if (reading.current) reading.current.scrollTop = 0; }, [hasAnalysis, waiting, error]);

  useEffect(() => {
    if (!hasAnalysis || firstShown.current) return;
    firstShown.current = true;
    trackStudioResultAction({ action: 'discovery_analysis_available', session_id: sessionId || '', duration_ms: Date.now() - start.current });
  }, [hasAnalysis, sessionId]);
  useEffect(() => {
    if (overview || !finding || viewed.current.has(finding.id)) return;
    viewed.current.add(finding.id);
    trackStudioResultAction({ action: 'discovery_finding_viewed', session_id: sessionId || '', finding_id: finding.id, finding_count: review.findings.length });
  }, [finding, overview, review.findings.length, sessionId]);
  const complete = () => {
    trackStudioResultAction({ action: 'discovery_result_opened', session_id: sessionId || '', reviewed_count: viewed.current.size,
      finding_count: review.findings.length, duration_ms: Date.now() - start.current });
    onComplete();
  };
  // Only leave automatically after the user explicitly chose to wait for the result.
  const completeRef = useRef(complete);
  completeRef.current = complete;
  useEffect(() => { if (waiting && completeAvailable && !error) completeRef.current(); }, [waiting, completeAvailable, error]);
  const choose = (next: number) => {
    const item = review.findings[next];
    if (!item) return;
    setFindingId(item.id);
    setOverviewRead(true);
    if (reading.current) reading.current.scrollTop = 0;
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };
  const readFindings = () => {
    setOverviewRead(true);
    if (reading.current) reading.current.scrollTop = 0;
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };

  const waitingForOutput = waiting && busy && !error;
  const openResult = () => { if (completeAvailable) complete(); else if (busy) setWaiting(true); else onDiscuss(); };
  const initial = !hasAnalysis && !error;
  const awaitingReply = initial && !busy;
  const status = error ? copy('پردازش متوقف شد؛ جزئیات را بررسی کن.')
    : awaitingReply ? copy('پاسخ گفت‌وگو آماده است.') : !busy ? copy(!plan ? 'تحلیل اولیه آماده است' : ready ? 'تصویر و پیشنهادها آماده‌اند.' : 'طرح و محصولات پیشنهادی آماده‌اند.')
    : stage?.trim() || copy(!hasAnalysis ? 'در حال بررسی عکس و شناخت فضا…' : !plan ? 'در حال طراحی و یافتن محصولات متناسب…' : 'در حال آماده‌سازی خروجی طراحی…');
  return <div className="studio-discovery-page" dir={siteDirection()} data-ready={completeAvailable && !error} data-analysis={hasAnalysis}>
    <Header hideSpacer />
    <main className="studio-discovery-main" data-view={error ? 'error' : initial ? 'initial' : waitingForOutput ? 'waiting' : 'analysis'}>
      <header className="studio-discovery-topline">
        <div><span>HOMA / STUDIO</span><DiscoveryElapsed startedAt={start.current} running={busy && !error} /></div>
        <div>{tools && <Dialog><DialogTrigger asChild><button type="button"><SlidersHorizontal size={15} />{copy('گزینه‌ها')}</button></DialogTrigger>
          <DialogContent className="studio-discovery-tools" dir={siteDirection()}><DialogTitle>{copy('گزینه‌های این طراحی')}</DialogTitle><DialogDescription>{copy('با بستن این بخش، به همان طراحی برمی‌گردی.')}</DialogDescription>{tools}</DialogContent>
        </Dialog>}{!busy && <button type="button" onClick={onNew}>{copy('طراحی جدید')}</button>}</div>
      </header>
      <DiscoveryProgress hasAnalysis={hasAnalysis} hasPlan={!!plan} done={completeAvailable && !error} failed={!!error} running={busy} />
      <div className="studio-discovery-layout">
        <figure className="studio-discovery-photo">
          {originalImage ? <AuthenticatedImage src={originalImage} alt={copy('عکس اصلی فضای شما')} /> : <div className="studio-discovery-photo-empty"><ImageIcon size={32} aria-hidden="true" /><p>{copy('تصویر فضای شما')}</p></div>}
          <figcaption><span>{copy('فضای شما')}</span><small>{copy(hasAnalysis ? 'از شناخت فضا تا یک تغییر حساب‌شده' : 'مبنای تحلیل و طراحی')}</small></figcaption>
        </figure>
        <section className="studio-discovery-content" aria-label={copy('برداشت هما از فضا')}>
          <div className="studio-discovery-status" data-error={!!error} data-ready={completeAvailable && !error}>
            {error ? <ImageIcon size={17} aria-hidden="true" /> : busy ? <Loader2 size={17} className="studio-spinner" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
            <div role="status" aria-live="polite">{completeAvailable && !error && <strong>{copy('طرح شما آمادهٔ دیدن است')}</strong>}<p>{status}</p></div>
          </div>
          <div className="studio-discovery-reading" ref={reading} tabIndex={0} aria-label={copy('جزئیات تحلیل و طراحی')}>
            {error && <div className="studio-flow-error" role="alert">{hasAnalysis ? <h2>{copy('این مرحله کامل نشد.')}</h2> : <h1>{copy('این مرحله کامل نشد.')}</h1>}<p>{error}</p></div>}
            {!hasAnalysis && error ? null : awaitingReply ? <div className="studio-discovery-no-findings"><h1>{copy('پاسخ هما را ببین')}</h1><p>{copy('هنوز طرحی برای نمایش ثبت نشده است. پیام‌ها و سؤال‌های این مرحله را در گفت‌وگو بررسی کن.')}</p><Button onClick={onDiscuss}>{copy('بازکردن گفت‌وگو')}</Button></div>
            : initial ? <InitialAnalysisLoading />
            : waitingForOutput ? <><DiscoveryLoading hasPlan={!!plan} /><Button variant="outline" onClick={() => setWaiting(false)}>{copy('بازگشت به نکته‌ها')}</Button></>
            : <>
              <div className="studio-discovery-analysis-heading"><span className="studio-discovery-kicker">{copy('شناخت فضا، پیش از تغییر')}</span><h1>{copy(overview ? 'اول، آنچه در فضای شما ارزشمند است' : 'فضا را قدم‌به‌قدم بهتر بشناسیم')}</h1></div>
              {overview ? <article key="overview" className="studio-discovery-introduction studio-discovery-reveal" aria-labelledby="studio-overview-title">
                <span className="studio-discovery-section-label" id="studio-overview-title">{copy('نقطهٔ قوت این فضا')}</span>
                <FindingText value={review.summary} />
                <div className="studio-discovery-up-next"><span>{copy('در ادامهٔ این مرور')}</span><p>{copy(review.findings.length ? 'نکته‌های فضا را یکی‌یکی ببین؛ بعد، طرح و پیشنهادها را کشف کن.' : 'مسیر پیشنهادی طراحی را ببین؛ بعد، به سراغ طرح و پیشنهادها برو.')}</p></div>
              </article> : finding ? <article key={finding.id} className="studio-discovery-finding studio-discovery-reveal" aria-labelledby="studio-finding-title">
                <div className="studio-discovery-finding-meta"><span>{copy(trackLabels[finding.track])}</span><span>{copy('نکتهٔ {{number}} از {{total}}', { number: number(index + 1), total: number(review.findings.length) })}</span></div>
                <nav className="studio-discovery-finding-nav" aria-label={copy('مرور نکته‌ها')}>{review.findings.map((item, step) => <button type="button" key={item.id} aria-label={copy('نکتهٔ {{number}}', { number: number(step + 1) })} aria-current={step === index ? 'step' : undefined} onClick={() => choose(step)}>{number(step + 1)}</button>)}</nav>
                <h2 id="studio-finding-title" tabIndex={-1} ref={heading}>{copy(finding.isObservation ? 'در عکس چه می‌بینیم؟' : 'دلیل این پیشنهاد')}</h2>
                {finding.observation && <FindingText key={`${finding.id}:observation`} value={finding.observation} className="studio-discovery-observation" />}
                {finding.suggestion && <div className="studio-discovery-suggestion"><Sparkles size={18} aria-hidden="true" /><div><h3>{copy('تغییر پیشنهادی')}</h3><FindingText key={`${finding.id}:suggestion`} value={finding.suggestion} /></div></div>}
              </article> : <div className="studio-discovery-no-findings"><h2>{copy('تحلیل اولیه آماده شد.')}</h2><p dir="auto">{copy('جزئیات طراحی پس از تکمیل مرحلهٔ بعد همین‌جا نمایش داده می‌شود.')}</p></div>}
              {!overview && review.direction && <details className="studio-discovery-overview" open={!finding || last}><summary>{copy('مسیر پیشنهادی طراحی')}<ChevronDown size={16} aria-hidden="true" /></summary><p dir="auto">{review.direction}</p></details>}
              {!overview && review.summary && <button type="button" className="studio-discovery-back-overview" onClick={() => setOverviewRead(false)}>{copy('بازگشت به برداشت اول')}</button>}
            </>}
          </div>
          {(hasAnalysis || error) && <footer className="studio-discovery-footer">
            {error ? <div className="studio-discovery-finding-actions"><Button variant="outline" disabled={busy} onClick={onRetry}>{copy('تلاش دوباره')}</Button>{plan && <Button disabled={busy} onClick={complete}>{copy('دیدن پیشنهادهای آماده')}</Button>}</div> : <>
            {!waitingForOutput && overview && <Button className="studio-discovery-begin-review" variant="outline" onClick={readFindings}>{copy(review.findings.length ? 'مرور نکته‌های فضا' : 'دیدن مسیر طراحی')}{siteDirection() === 'rtl' ? <ArrowLeft size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</Button>}
            {!waitingForOutput && !overview && finding && <div className="studio-discovery-finding-actions">
              <Button variant="ghost" disabled={index === 0} onClick={() => choose(index - 1)}>{siteDirection() === 'rtl' ? <ArrowRight size={16} aria-hidden="true" /> : <ArrowLeft size={16} aria-hidden="true" />}{copy('قبلی')}</Button>
              <Button variant="outline" onClick={() => last ? openResult() : choose(index + 1)}>{copy(last ? 'پایان مرور' : 'نکتهٔ بعدی')}{siteDirection() === 'rtl' ? <ArrowLeft size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</Button>
            </div>}
            <div className="studio-discovery-result-action">
              {!waitingForOutput && <Button onClick={openResult} variant={completeAvailable ? 'default' : 'ghost'}>{copy(!busy && !plan ? 'گفت‌وگو برای ادامه' : ready ? 'دیدن تصویر و پیشنهادها' : completeAvailable ? 'دیدن پیشنهادهای آماده' : 'مستقیم به نتیجه')}{completeAvailable && (siteDirection() === 'rtl' ? <ArrowLeft size={18} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />)}</Button>}
              <button className="studio-discovery-discuss" type="button" onClick={onDiscuss} aria-label={copy('گفت‌وگو دربارهٔ این فضا')}><MessageSquare size={18} aria-hidden="true" />{waitingForOutput && copy('گفت‌وگو دربارهٔ این فضا')}</button>
            </div>
            </>}
          </footer>}
        </section>
      </div>
    </main>
    {panel && <div className="studio-discovery-conversation">{panel}</div>}
  </div>;
}
