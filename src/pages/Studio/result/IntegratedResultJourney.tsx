import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { toLocalizedDigits } from '@/utils/formatters';
import { useSiteTranslation } from '@/i18n/siteCopy';
import type { JourneyFinding } from '../../RoomRedesign/services/resultJourney';
import './integrated-journey.css';

export function ResultReveal({ before, after, onComplete }: { before: string; after: string; onComplete: () => void }) {
  const { siteText: copy } = useSiteTranslation();
  const [finished, setFinished] = useState(false);
  const completion = useRef(onComplete); completion.current = onComplete;
  const called = useRef(false);
  const finish = () => { if (!called.current) { called.current = true; setFinished(true); completion.current(); } };
  const done = useRef(finish); done.current = finish;
  useEffect(() => {
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (motion?.matches) { done.current(); return; }
    const timer = setTimeout(() => done.current(), 4700);
    const change = () => { if (motion?.matches) done.current(); };
    motion?.addEventListener('change', change);
    return () => { clearTimeout(timer); motion?.removeEventListener('change', change); };
  }, []);
  return createPortal(<div className="homa-result-reveal homa-v9" data-finished={finished} role="region" aria-label={copy('نمایش قبل و بعد طراحی شما')}>
    <img src={before} alt={copy('فضای شما پیش از طراحی')} draggable={false} />
    <div className="homa-result-reveal-after" onAnimationEnd={finish}><img src={after} alt={copy('فضای شما پس از طراحی')} draggable={false} /></div>
    <div className="homa-v9-reveal-divider" aria-hidden="true"><span>‹ ›</span></div>
    <div className="homa-v9-reveal-brand">HOMA</div>
    <div className="homa-result-reveal-copy"><span>YOUR SPACE, REIMAGINED</span><h1>{copy('فضای تو، با نگاهی تازه.')}</h1><p>{copy('دلیل تغییرها را قدم‌به‌قدم ببین.')}</p></div>
    <button type="button" className="homa-result-reveal-skip" onClick={finish}>{copy('دیدن تحلیل‌ها')}</button>
  </div>, document.body);
}

const labels: Record<string, string> = { keep: 'حفظ', move: 'جابه‌جایی', remove: 'حذف', replace: 'تعویض', add: 'افزودن', restyle: 'بهبود استایل' };
export function AnalysisGuide({ findings, image, onClose, onProduct }: {
  findings: JourneyFinding[]; image: string; onClose: () => void; onProduct?: (key: string) => void;
}) {
  const { siteText: copy } = useSiteTranslation();
  const [index, setIndex] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const current = findings[Math.min(index, findings.length - 1)];
  useEffect(() => { body.current?.scrollTo?.({ top: 0 }); title.current?.focus({ preventScroll: true }); }, [index]);
  if (!current) return null;
  const progress = `${toLocalizedDigits(index + 1)} ${copy('از')} ${toLocalizedDigits(findings.length)}`;
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="homa-analysis-backdrop" />
      <Dialog.Content className="homa-analysis-sheet homa-v9" dir="rtl" aria-modal="true" onOpenAutoFocus={event => { event.preventDefault(); title.current?.focus({ preventScroll: true }); }} onCloseAutoFocus={event => event.preventDefault()}>
        <div className="homa-analysis-grab" aria-hidden="true" />
        <header><span>HOMA / DESIGN NOTES</span><button type="button" onClick={onClose}>{copy('رد کردن')}</button></header>
        <Dialog.Description className="sr-only">{copy('مرور مرحله‌به‌مرحلهٔ تصمیم‌های واقعی طراحی')}</Dialog.Description>
        <div className="homa-analysis-progress" role="progressbar" aria-label={copy('پیشرفت مرور تحلیل‌ها')} aria-valuemin={1} aria-valuemax={findings.length} aria-valuenow={index + 1} style={{ '--guide-progress': `${(index + 1) / findings.length * 100}%` } as CSSProperties}><i /></div>
        {image && <figure><img src={image} alt={copy('طرح واقعی فضای شما')} /><figcaption>{copy('فضای شما')}<strong>{current.title || copy('تصمیم طراحی')}</strong></figcaption></figure>}
        <div className="homa-analysis-scroll" ref={body}>
          <div className="homa-analysis-meta"><span>{labels[current.kind] ? copy(labels[current.kind]) : copy('تحلیل فضا')}</span><span aria-live="polite">{progress}</span></div>
          <Dialog.Title ref={title} tabIndex={-1}>{current.title || copy('آنچه در فضای شما دیده‌ایم')}</Dialog.Title>
          <dl>
            {current.before && <div><dt>{copy('قبل')}</dt><dd>{current.before}</dd></div>}
            {current.recommendation && <div><dt>{copy('تصمیم هما')}</dt><dd>{current.recommendation}</dd></div>}
            {current.reason && <div><dt>{copy('دلیل تغییر')}</dt><dd>{current.reason}</dd></div>}
          </dl>
          {current.purchaseKey && onProduct && <button type="button" className="homa-analysis-related" onClick={() => onProduct(current.purchaseKey!)}>{copy('دیدن محصول مرتبط')}</button>}
        </div>
        <footer><button type="button" disabled={!index} onClick={() => setIndex(value => Math.max(0, value - 1))}>{copy('قبلی')}</button><button type="button" onClick={() => index === findings.length - 1 ? onClose() : setIndex(value => value + 1)}>{copy(index === findings.length - 1 ? 'دیدن پیشنهادهای محصول' : 'تحلیل بعدی')}<span aria-hidden="true">←</span></button></footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
