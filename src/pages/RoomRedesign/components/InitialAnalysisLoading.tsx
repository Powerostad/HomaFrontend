import { useMemo } from 'react';
import { ProgressScreen, type ProgressStep } from '@/components/ProgressScreen';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { Loader2 } from 'lucide-react';

/** Original Studio loading visual, driven by the current service status. */
export function InitialAnalysisLoading({ image, stage }: { image: string | null; stage?: string | null }) {
  const { siteText: copy } = useSiteTranslation();
  const steps = useMemo<ProgressStep[]>(() => ['تحلیل فضا', 'مرور تغییرها', 'تصویر و پیشنهادها'].map(label => ({ label: copy(label), subMessages: [], estimatedSec: 0 })), [copy]);
  return <section className="studio-initial-loading studio-original-loader" aria-labelledby="studio-initial-title" aria-busy="true">
    <ProgressScreen bgImage={image} steps={steps} activeStepIndex={0} tips={[]}
      liveStatus={<>
        <div className="studio-original-loader-mark" aria-hidden="true"><Loader2 className="studio-spinner" size={28} /></div>
        <h1 id="studio-initial-title">{copy('هما در حال تحلیل فضای شماست')}</h1>
        <p role="status" aria-live="polite"><span className="studio-original-loader-dot" aria-hidden="true" />{stage?.trim() || copy('در حال پردازش عکس شما…')}</p>
        <small>{copy('پس از تحلیل، تغییرهای پیشنهادی را قدم‌به‌قدم می‌بینی.')}</small>
      </>} />
  </section>;
}
