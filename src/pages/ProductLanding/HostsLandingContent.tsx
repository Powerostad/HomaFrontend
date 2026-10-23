import { ArrowLeft } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { StylePhoto } from '@/pages/RoomRedesign/intake/StylePhoto';
import { HOST_GOALS } from '@/pages/RoomRedesign/intake/studioOnboarding';
import { AudienceNavigation } from './components/AudienceNavigation';
import { RoomEntrySection } from './components/RoomEntrySection';
import './components/studio-landing.css';

/** Provider-free content also used by the public HTML renderer. */
export function HostsLandingContent() {
  const { siteText: copy, siteDirection } = useSiteTranslation();
  return <div className="hosts-landing" dir={siteDirection()}>
    <AudienceNavigation host />
    <section className="hosts-editorial-hero">
      <figure><StylePhoto row={0} col={1} label={copy('اتاق اقامتگاه با چوب و پارچه‌های طبیعی')} /><figcaption>{copy('الهام برای طراحی اقامتگاه')}</figcaption></figure>
      <div><span className="home-editorial-eyebrow">HOMA / HOSTS</span>
        <h1>{copy('اقامتگاهت؛')}<br /><em>{copy('آمادهٔ میزبانی بهتر.')}</em></h1>
        <p>{copy('از عکس آگهی تا راحتی مهمان؛ طراحی فضا با توجه به بودجه، دوام وسایل و نگهداری روزمره.')}</p>
        <a className="editorial-start" href="/studio/hosts">{copy('شروع طراحی اقامتگاه')}<span><ArrowLeft size={16} /></span></a>
        <small>{copy('برای میزبان‌های جاباما و دیگر اقامتگاه‌های کوتاه‌مدت')}</small>
      </div>
    </section>
    <section className="hosts-priorities"><header><h2>{copy('با نگاه یک میزبان طراحی کن.')}</h2><p>{copy('اولویت را خودت تعیین می‌کنی؛ پیشنهادها با شرایط اقامتگاهت هماهنگ می‌شوند.')}</p></header>
      <div>{HOST_GOALS.map(goal => <article key={goal.id}><h3>{copy(goal.label)}</h3><p>{copy(goal.hint)}</p></article>)}</div>
    </section>
    <RoomEntrySection host />
  </div>;
}
