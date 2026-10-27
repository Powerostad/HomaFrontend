import { useMemo, type ReactNode } from 'react';
import { createInstance } from 'i18next';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { PencilLine } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';
import './refinement-invite-prototype.css';

/** Local preview only. No production copy or shared translation store is changed. */
export function RefinementPrototypeShell({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const prototypeI18n = useMemo(() => {
    const instance = createInstance();
    void instance.init({ ...i18n.options, lng: i18n.language,
      resources: structuredClone(i18n.store.data), initImmediate: false });
    instance.addResourceBundle('fa', 'translation', {
      studioWorkspace: { conversation: 'اصلاح طرح' },
      studioChat: { chat: 'اصلاح طراحی', chatHint: 'دربارهٔ طراحی سؤال بپرس یا تغییر دلخواهت را بنویس.' },
    }, true, true);
    instance.addResourceBundle('en', 'translation', {
      studioWorkspace: { conversation: 'Refine design' },
      studioChat: { chat: 'Refine your design', chatHint: 'Ask about your design or describe a change.' },
    }, true, true);
    return instance;
  }, [i18n]);
  return <I18nextProvider i18n={prototypeI18n}><div className="studio-refinement-prototype">{children}</div></I18nextProvider>;
}

export function RefinementInvitePrototype({ onStart }: { onStart: (draft?: string) => void }) {
  const { siteText: copy } = useSiteTranslation();
  const examples = [
    { title: 'تغییر رنگ‌ها', draft: 'دوست دارم رنگ پرده روشن‌تر باشه. چه رنگی برای این طرح مناسب‌تره؟' },
    { title: 'اصلاح چیدمان', draft: 'می‌خوام چیدمان رو اصلاح کنیم تا مسیر رفت‌وآمد بازتر بشه.' },
    { title: 'محصولات متفاوت', draft: 'برای همین طراحی، محصولات متفاوتی پیشنهاد بده که با فضای من هماهنگ باشن.' },
  ];
  return <section className="studio-refinement-invite" aria-labelledby="refinement-invite-title">
    <span className="studio-refinement-eyebrow">{copy('طراحی اختصاصی تو')}</span>
    <h2 id="refinement-invite-title">{copy('دوست داری چیزی رو تغییر بدیم؟')}</h2>
    <p>{copy('رنگ‌ها، چیدمان یا محصولات رو مطابق سلیقه‌ات دقیق‌تر کنیم.')}</p>
    <button type="button" className="studio-refinement-entry" onClick={() => onStart()}
      aria-label={copy('نوشتن درخواست اصلاح طراحی')} aria-haspopup="dialog">
      <span>{copy('مثلاً: رنگ پرده روشن‌تر باشه…')}</span>
      <span className="studio-refinement-entry-icon" aria-hidden="true"><PencilLine size={18} /></span>
    </button>
    <div className="studio-refinement-examples" role="group" aria-label={copy('شروع با یک پیشنهاد')}>
      {examples.map(example => <button key={example.title} type="button" onClick={() => onStart(copy(example.draft))}
        aria-haspopup="dialog">{copy(example.title)}</button>)}
    </div>
    <small>{copy('می‌تونی دربارهٔ طرح سؤال هم بپرسی. درخواستت رو قبل از ارسال ویرایش کن.')}</small>
  </section>;
}
