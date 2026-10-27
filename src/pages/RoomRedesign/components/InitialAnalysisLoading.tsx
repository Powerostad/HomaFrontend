import { ScanLine } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';

/** A real pending state: no estimated percentages or invented room findings. */
export function InitialAnalysisLoading() {
  const { siteText: copy } = useSiteTranslation();
  return <section className="studio-initial-loading" aria-labelledby="studio-initial-title" aria-busy="true">
    <div className="studio-processing-symbol" aria-hidden="true"><ScanLine size={30} strokeWidth={1.2} /></div>
    <span className="studio-discovery-kicker">{copy('اول، شناخت فضای شما')}</span>
    <h1 id="studio-initial-title">{copy('چه چیزی این فضا را بهتر می‌کند؟')}</h1>
    <p>{copy('چیدمان، نور و هماهنگی وسایل بررسی می‌شوند. تحلیل که آماده شود، همین‌جا نمایش داده می‌شود.')}</p>
    <div className="studio-processing-next"><span>{copy('قدم بعد')}</span><b>{copy('دیدن تحلیل فضا و مسیر پیشنهادی طراحی')}</b></div>
    <small>{copy('می‌توانی همین صفحه را باز نگه داری؛ نیازی به ارسال دوبارهٔ درخواست نیست.')}</small>
  </section>;
}
