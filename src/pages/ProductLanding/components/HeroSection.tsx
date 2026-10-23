import { ArrowLeft, ArrowUpLeft } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { StylePhoto } from '../../RoomRedesign/intake/StylePhoto';
import { ROOMS } from '../../RoomRedesign/intake/studioOnboarding';
import '../../RoomRedesign/intake/studio-onboarding.css';
import './studio-landing.css';

export interface HeroSectionProps { onGetStarted?: () => void }
/** Plain links keep the public server-rendered landing usable before hydration. */
export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const { siteText: copy, siteDirection } = useSiteTranslation();
  return <div className="studio-landing" dir={siteDirection()}>
    <section className="studio-landing-hero">
      <div className="studio-landing-hero-copy"><span className="studio-landing-eyebrow">HOMA / THE LIVING EDIT</span>
        <h1>{copy('همان خانه.')}<br /><em>{copy('یک حس تازه.')}</em></h1>
        <p>{copy('از یک عکس شروع کن. سلیقه‌ات را نشان بده و ببین چطور می‌شود فضای خودت را بهتر چید، هماهنگ کرد و کامل‌تر ساخت.')}</p>
        <a className="studio-landing-cta" href="/studio" onClick={onGetStarted ? event => { event.preventDefault(); onGetStarted(); } : undefined}>{copy('طراحی فضای من')}<ArrowLeft size={18} /></a>
        <a className="studio-landing-host-link" href="/studio/hosts">{copy('میزبان اقامتگاه هستی؟')}<ArrowUpLeft size={15} /></a>
        <span className="studio-landing-small">{copy('عکس تو · انتخاب‌های تو · پیشنهاد طراح')}</span>
      </div>
      <figure className="studio-landing-hero-image"><picture><source media="(max-width: 640px)" srcSet="/images/hero/after-mobile.webp" /><img src="/images/hero/after.webp" alt={copy('فضای نشیمن با رنگ‌های گرم، بافت طبیعی و چیدمان هماهنگ')} fetchPriority="high" /></picture><figcaption><span>{copy('برای زندگی در خانه')}</span><span>THE HOMA STUDIO</span></figcaption></figure>
    </section>
    <section className="studio-landing-spaces" aria-labelledby="studio-spaces-title"><header><div><span className="studio-landing-eyebrow">ROOM BY ROOM</span><h2 id="studio-spaces-title">{copy('یک فضا را انتخاب کن.')}</h2></div><p>{copy('هر اتاق، حال‌وهوای خودش را دارد. از جایی شروع کن که بیشتر دوست داری تغییرش را ببینی.')}</p></header>
      <div>{ROOMS.map(room => <a key={room.id} href={`/studio?audience=home&room=${room.id}`}><StylePhoto row={room.row} col={room.id === 'living_room' ? 1 : 0} label={copy(room.label)} /><span><b>{copy(room.label)}</b><ArrowUpLeft size={18} /></span><small>{copy(room.hint)}</small></a>)}</div>
    </section>
    <section className="studio-landing-how"><span className="studio-landing-eyebrow">A LITTLE GUIDANCE</span><h2>{copy('لازم نیست طراح باشی.')}</h2><div>{[
      ['یک عکس از فضای واقعی', 'نور روز، یک کادر واضح و وسایلی که همین حالا داری.'],
      ['چند انتخاب ساده و تصویری', 'از میان حال‌وهواها انتخاب کن؛ اسم سبک‌ها را لازم نیست بدانی.'],
      ['طرحی برای شرایط خودت', 'با توجه به بودجه، وسایل ثابت و آنچه برایت مهم است.'],
    ].map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{copy(title)}</h3><p>{copy(text)}</p></article>)}</div></section>
    <section className="studio-landing-hosts"><StylePhoto row={0} col={1} label={copy('اتاق اقامتگاه با چوب و پارچه‌های طبیعی')} /><div><span className="studio-landing-eyebrow">THE HOST EDIT</span><h2>{copy('جایی که مهمان')}<br /><em>{copy('دلش بخواهد بماند.')}</em></h2><p>{copy('برای میزبان‌های جاباما و دیگر اقامتگاه‌ها: مسیر طراحی با توجه به راحتی مهمان، عکس آگهی و نگهداری روزمرهٔ فضا.')}</p><a href="/studio/hosts" className="studio-landing-cta">{copy('شروع طراحی اقامتگاه')}<ArrowLeft size={18} /></a></div></section>
  </div>;
}
