import { Layers3 } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';

/** Explain the next deliverable without pretending a render has already run. */
export function DiscoveryLoading({ hasPlan = false }: { hasPlan?: boolean }) {
  const { siteText: copy } = useSiteTranslation();
  return <div className="studio-discovery-loading" aria-busy="true">
    <div className="studio-processing-symbol" aria-hidden="true"><Layers3 size={30} strokeWidth={1.2} /></div>
    <span className="studio-discovery-kicker">{copy('تحلیل اولیه آماده است')}</span>
    <h1>{copy(hasPlan ? 'خروجی طراحی در حال آماده‌شدن است.' : 'از شناخت فضا به طراحی می‌رسیم.')}</h1>
    <p>{copy(hasPlan ? 'پیشنهادهای ثبت‌شده حفظ شده‌اند. بعد از تکمیل پردازش، خروجی همین‌جا باز می‌شود.' : 'جهت طراحی و محصولات متناسب با فضای شما آماده می‌شوند. می‌توانی در این فاصله تحلیل را بخوانی.')}</p>
    <div className="studio-processing-next"><span>{copy('در ادامه می‌بینی')}</span><b>{copy('طرح فضا و محصولات پیشنهادی')}</b></div>
  </div>;
}
