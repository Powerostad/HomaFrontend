import { trackStudioResultAction } from '@/analytics/events';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ImageIcon, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ExecutionPlan } from '../services/redesignChatService';
import { buildDiscoveryReview, type DiscoveryTrack } from '../services/discoveryReview';
import '../discovery.css';

const trackLabels: Record<DiscoveryTrack, string> = {
  layout: 'چیدمان و تناسب', harmony: 'هماهنگی فضا', function: 'کارکرد روزمره', surfaces: 'نور و سطوح', idea: 'ایدهٔ تغییر',
};

function FindingText({ value, className = '' }: { value: string; className?: string }) {
  const { siteText: copy } = useSiteTranslation();
  const [expanded, setExpanded] = useState(false);
  const long = value.length > 240;
  return <div className="studio-discovery-copy"><p dir="auto" className={`${className}${long && !expanded ? ' studio-discovery-clamped' : ''}`}>{value}</p>
    {long && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(previous => !previous)}>{copy(expanded ? 'کمتر' : 'متن کامل')}</button>}
  </div>;
}

export function StudioDiscovery({ plan, originalImage, sessionId, busy, error, resultAvailable, onRetry, onComplete, onNew, onDiscuss, panel }: {
  plan: ExecutionPlan | null; originalImage: string | null; sessionId: string | null; busy: boolean; error: string | null;
  resultAvailable: boolean;
  onRetry: () => void; onComplete: () => void; onNew: () => void; onDiscuss: () => void; panel?: ReactNode;
}) {
  const { siteText: copy, siteDirection, siteLocale } = useSiteTranslation();
  const review = useMemo(() => buildDiscoveryReview(plan), [plan]);
  const [findingId, setFindingId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const viewed = useRef(new Set<string>());
  const firstShown = useRef(false);
  const start = useRef(Date.now());
  const index = Math.max(0, review.findings.findIndex(finding => finding.id === findingId));
  const finding = review.findings[index];
  const completeAvailable = !!plan && !busy;
  const ready = completeAvailable && !error && resultAvailable;
  const last = index === review.findings.length - 1;
  const number = (value: number) => value.toLocaleString(siteLocale());

  useEffect(() => {
    if (!plan || firstShown.current) return;
    firstShown.current = true;
    trackStudioResultAction({ action: 'discovery_analysis_available', session_id: sessionId || '', duration_ms: Date.now() - start.current });
  }, [plan, sessionId]);
  useEffect(() => {
    if (!finding || viewed.current.has(finding.id)) return;
    viewed.current.add(finding.id);
    trackStudioResultAction({ action: 'discovery_finding_viewed', session_id: sessionId || '', finding_id: finding.id, finding_count: review.findings.length });
  }, [finding, review.findings.length, sessionId]);
  const complete = () => {
    trackStudioResultAction({ action: 'discovery_result_opened', session_id: sessionId || '', reviewed_count: viewed.current.size,
      finding_count: review.findings.length, duration_ms: Date.now() - start.current });
    onComplete();
  };
  // Only leave automatically after the user explicitly chose to wait for the result.
  const completeRef = useRef(complete);
  completeRef.current = complete;
  useEffect(() => { if (waiting && completeAvailable) completeRef.current(); }, [waiting, completeAvailable]);
  const choose = (next: number) => {
    const item = review.findings[next];
    if (!item) return;
    setFindingId(item.id);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  };

  return <div className="studio-discovery-page" dir={siteDirection()}>
    <Header />
    <main className="studio-discovery-main">
      <div className="studio-discovery-topline"><span>HOMA / {copy('فضای شما، قدم‌به‌قدم')}</span><button type="button" onClick={onNew}>{copy('طراحی جدید')}</button></div>
      <ol className="studio-discovery-steps" aria-label={copy('مسیر طراحی')}>
        {['تحلیل فضا', 'مرور تغییرها', 'تصویر و پیشنهادها'].map((label, step) => <li key={label} aria-current={step === (!plan ? 0 : waiting ? 2 : 1) ? 'step' : undefined} data-complete={!!plan && step === 0}>
          <span>{plan && step === 0 ? <Check size={15} aria-hidden="true" /> : number(step + 1)}</span>{copy(label)}
        </li>)}
      </ol>
      <div className="studio-discovery-layout">
        <figure className="studio-discovery-photo">
          {originalImage ? <AuthenticatedImage src={originalImage} alt={copy('عکس اصلی فضای شما')} /> : <div className="studio-discovery-photo-empty"><ImageIcon size={32} aria-hidden="true" /><p>{copy('تصویر فضای شما')}</p></div>}
          <figcaption>{copy('فضای شما')}<small>{copy('همهٔ پیشنهادها از همین عکس شروع می‌شوند.')}</small></figcaption>
        </figure>
        <section className="studio-discovery-content" aria-label={copy('برداشت هما از فضا')}>
          <div className="studio-discovery-status" role="status">
            {busy ? <Loader2 size={16} className="studio-spinner" aria-hidden="true" /> : error ? <ImageIcon size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            <span>{copy(error ? 'این مرحله به بررسی نیاز دارد.' : !plan ? 'در حال بررسی فضای شما…' : ready ? 'نتیجه آماده است؛ هر وقت خواستی آن را باز کن.' : completeAvailable ? 'پیشنهادها آماده‌اند؛ تصویر تازه‌ای ثبت نشده است.' : 'تصویر و پیشنهادها در حال آماده‌شدن‌اند.')}</span>
          </div>
          {error && <div className="studio-flow-error" role="alert"><p>{error}</p><Button variant="outline" disabled={busy} onClick={onRetry}>{copy('تلاش دوباره')}</Button>{plan && <Button disabled={busy} onClick={complete}>{copy('دیدن پیشنهادهای آماده')}</Button>}</div>}
          {!plan ? <div className="studio-discovery-pending">
            <span className="studio-discovery-kicker">{copy('یک نگاه تازه به فضای شما')}</span>
            <h1>{copy('اول می‌فهمیم چه چیزی می‌تواند بهتر شود.')}</h1>
            <p>{copy('وقتی تحلیل آماده شد، نکته‌ها را یکی‌یکی مرور می‌کنیم؛ بعد تصویر و پیشنهادهای مرتبط را می‌بینی.')}</p>
            {busy && <div className="studio-discovery-skeleton" aria-hidden="true"><i /><i /><i /></div>}
          </div> : waiting ? <div className="studio-discovery-pending">
            <span className="studio-discovery-kicker">{copy('قدم بعد، دیدن نتیجه')}</span>
            <h1>{copy('تصویر و پیشنهادهای فضای شما')}</h1>
            <p>{copy('پس از آماده‌شدن، نتیجه همین‌جا باز می‌شود. لازم نیست درخواست تازه‌ای بفرستی.')}</p>
            <Button variant="outline" onClick={() => setWaiting(false)}>{copy('بازگشت به نکته‌ها')}</Button>
          </div> : <>
            <h1>{copy('چه چیزی بهتر می‌شود؟')}</h1>
            {finding ? <article className="studio-discovery-finding" aria-labelledby="studio-finding-title">
              <div className="studio-discovery-finding-meta"><span>{copy(trackLabels[finding.track])}</span><span>{number(index + 1)} / {number(review.findings.length)}</span></div>
              <h2 id="studio-finding-title" tabIndex={-1} ref={heading}>{copy(finding.isObservation ? 'چیزی که در عکس دیدیم' : 'ایده‌ای برای این فضا')}</h2>
              {finding.observation && <FindingText key={`${finding.id}:observation`} value={finding.observation} className="studio-discovery-observation" />}
              {finding.suggestion && <div className="studio-discovery-suggestion"><Sparkles size={20} aria-hidden="true" /><div><h3>{copy('پیشنهاد تغییر')}</h3><FindingText key={`${finding.id}:suggestion`} value={finding.suggestion} /></div></div>}
              <div className="studio-discovery-finding-actions">
                <Button variant="ghost" disabled={index === 0} onClick={() => choose(index - 1)}>{siteDirection() === 'rtl' ? <ArrowRight size={16} aria-hidden="true" /> : <ArrowLeft size={16} aria-hidden="true" />}{copy('قبلی')}</Button>
                <Button variant="outline" onClick={() => last ? completeAvailable ? complete() : setWaiting(true) : choose(index + 1)}>{copy(last ? 'پایان مرور' : 'نکتهٔ بعدی')}{siteDirection() === 'rtl' ? <ArrowLeft size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}</Button>
              </div>
            </article> : <div className="studio-discovery-no-findings"><h2>{copy('تحلیل اولیه آماده شد.')}</h2><p dir="auto">{review.direction || review.summary || copy('جزئیات تشخیصی جداگانه‌ای برای این نتیجه ثبت نشده است.')}</p></div>}
            {(review.summary || review.direction) && <details className="studio-discovery-overview"><summary>{copy('نگاه کلی به این فضا')}<ChevronDown size={16} aria-hidden="true" /></summary>{review.summary && <p dir="auto">{review.summary}</p>}{review.direction && <p dir="auto">{review.direction}</p>}</details>}
            <button className="studio-discovery-discuss" type="button" onClick={() => { onDiscuss(); requestAnimationFrame(() => document.getElementById('studio-discovery-conversation')?.scrollIntoView({ block: 'nearest', behavior: 'instant' })); }}><MessageSquare size={17} aria-hidden="true" />{copy('سؤال یا اصلاحی داری؟ با هما در میان بگذار.')}</button>
          </>}
          {plan && !waiting && !error && <div className="studio-discovery-result-action"><Button onClick={() => completeAvailable ? complete() : setWaiting(true)}>{copy(ready ? 'دیدن تصویر و پیشنهادها' : completeAvailable ? 'دیدن پیشنهادهای آماده' : 'مستقیم به نتیجه')}</Button><small>{copy('مرور همهٔ نکته‌ها اجباری نیست.')}</small></div>}
          {panel && <div className="studio-discovery-conversation" id="studio-discovery-conversation">{panel}</div>}
        </section>
      </div>
    </main>
  </div>;
}
