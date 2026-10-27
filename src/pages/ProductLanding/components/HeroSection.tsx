import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { AudienceNavigation } from './AudienceNavigation';
import './studio-landing.css';

export interface HeroSectionProps { onGetStarted?: () => void }

/** The original image-led hero, shared by client and server-rendered landing. */
export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const { t } = useTranslation();
  const { siteText: copy, siteDirection } = useSiteTranslation();
  return <div className="home-landing" dir={siteDirection()}>
    <AudienceNavigation />
    <section className="home-editorial-hero">
      <div className="home-editorial-visual">
        <BeforeAfterSlider beforeImage="/images/hero/before.png" afterImage="/images/hero/after.png" priority />
      </div>
      <div className="home-editorial-copy">
        <span className="home-editorial-eyebrow">{t('landing.hero.editorial', 'Homa Editorial')}</span>
        <h1>{t('landing.hero.title', 'هُما؛')} <em>{t('landing.hero.titleAccent', 'نسخه‌یِ بهترِ')}</em><br />{t('landing.hero.titleEnd', 'خونه‌ت.')}</h1>
        <p>{t('landing.hero.description', 'هُما کمکت می‌کنه دکور مناسب خونه‌ت رو پیدا کنی.')}</p>
        <a className="editorial-start" href="/studio" onClick={onGetStarted ? event => { event.preventDefault(); onGetStarted(); } : undefined}>
          {t('landing.hero.cta', 'نسخهٔ جدیدِ خونه‌تو ببین')}<span><ArrowLeft size={16} /></span>
        </a>
      </div>
      <p className="home-editorial-caption">{copy('قبل و بعد را با جابه‌جایی خط تصویر مقایسه کن.')}</p>
    </section>
  </div>;
}
