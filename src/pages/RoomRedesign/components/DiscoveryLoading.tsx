import { useEffect, useState } from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';

const tips = [
  'یک فرش بزرگ‌تر می‌تواند چند تکه مبلمان را به یک محدودهٔ منسجم تبدیل کند.',
  'نور در چند ارتفاع، معمولاً فضایی دلنشین‌تر از یک چراغ سقفی تنها می‌سازد.',
  'تکرار یک رنگ در دو یا سه نقطه، به هماهنگی بصری فضا کمک می‌کند.',
  'گاهی جابه‌جایی یک وسیله کافی است؛ تغییر خوب همیشه به خرید تازه نیاز ندارد.',
];

/** Design inspiration is not a claim about analysis progress or the uploaded room. */
export function DiscoveryLoading({ stage, waiting = false }: { stage?: string; waiting?: boolean }) {
  const { siteText: copy, siteLocale } = useSiteTranslation();
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) setTip(value => (value + 1) % tips.length); }, 8000);
    return () => clearInterval(timer);
  }, []);
  return <div className="studio-discovery-loading">
    <div className="studio-discovery-orbit" aria-hidden="true"><span /><span /><Sparkles size={28} /></div>
    <span className="studio-discovery-kicker">{copy(waiting ? 'قدم بعد، دیدن نتیجه' : 'یک نگاه تازه به فضای شما')}</span>
    <h1>{copy(waiting ? 'ایده‌ها در مسیر تصویر شدن‌اند.' : 'برای فضای تو، یک نگاه تازه می‌سازیم.')}</h1>
    <p role="status">{stage || copy(waiting ? 'تصویر و پیشنهادها در حال آماده‌شدن‌اند.' : 'در حال بررسی فضای شما…')}</p>
    <div className="studio-discovery-activity" aria-hidden="true"><i /></div>
    <aside className="studio-discovery-tip" aria-label={copy('الهام طراحی')}>
      <div><Lightbulb size={18} aria-hidden="true" /><strong>{copy('در این فاصله، یک ایدهٔ کوچک')}</strong></div>
      <p>{copy(tips[tip])}</p>
      <nav aria-label={copy('ایده‌های طراحی')}>{tips.map((_, index) => <button key={index} type="button" aria-label={copy('ایدهٔ {{number}}', { number: (index + 1).toLocaleString(siteLocale()) })} aria-pressed={tip === index} onClick={() => setTip(index)}><span /></button>)}</nav>
    </aside>
    <small>{copy('به‌محض آماده‌شدن تحلیل، نکته‌های واقعی این فضا را با هم مرور می‌کنیم؛ نیازی به درخواست دوباره نیست.')}</small>
  </div>;
}
