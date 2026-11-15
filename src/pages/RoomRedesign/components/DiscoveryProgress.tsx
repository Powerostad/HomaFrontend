import { Check, Clock3, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSiteTranslation } from '@/i18n/siteCopy';

/** Only accepted analysis, saved plan and terminal state advance these milestones. */
export function DiscoveryProgress({ hasAnalysis, hasPlan, done, failed, running = true }: { hasAnalysis: boolean; hasPlan: boolean; done: boolean; failed: boolean; running?: boolean }) {
  const { siteText: copy, siteLocale } = useSiteTranslation();
  const current = hasPlan ? 2 : hasAnalysis ? 1 : 0;
  return <ol className="studio-discovery-steps" aria-label={copy('مسیر طراحی')}>
    {['شناخت فضا', 'طراحی و محصولات', 'خروجی نهایی'].map((label, index) => {
      const complete = done || index < current;
      return <li key={label} data-complete={complete} aria-current={!done && index === current ? 'step' : undefined}>
        <span>{complete ? <Check size={14} aria-hidden="true" /> : index === current && (failed || running) ? failed ? <AlertCircle size={14} aria-hidden="true" /> : <Loader2 size={14} className="studio-spinner" aria-hidden="true" /> : (index + 1).toLocaleString(siteLocale())}</span>{copy(label)}
      </li>;
    })}
  </ol>;
}

export function DiscoveryElapsed({ startedAt, running }: { startedAt: number; running: boolean }) {
  const { siteText: copy, siteLocale } = useSiteTranslation();
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, running]);
  const format = (value: number) => value.toLocaleString(siteLocale(), { minimumIntegerDigits: 2, useGrouping: false });
  return <span className="studio-discovery-elapsed" title={copy('زمان انتظار در این صفحه')}><Clock3 size={13} aria-hidden="true" /><span>{copy('زمان انتظار')}</span><bdi>{format(Math.floor(seconds / 60))}:{format(seconds % 60)}</bdi></span>;
}
