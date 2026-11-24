import { ArrowLeft, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './editorial-home.css';

export function HeroSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const { t } = useTranslation();
  return <section className="homa-home-hero" aria-labelledby="homa-home-title">
    <img className="homa-editorial-hero-photo" src="/images/home-editorial/hero.webp" alt="" {...{ fetchpriority: 'high' }} decoding="sync" />
    <div className="homa-editorial-hero-copy">
      <h1 id="homa-home-title">{t('landing.experience.hero.title')}<br /><span>{t('landing.experience.hero.accent')}</span></h1>
      <p>{t('landing.experience.hero.description')}</p>
      <Link to="/studio" onClick={onGetStarted} className="homa-home-button">{t('landing.experience.start')}<ArrowLeft size={21} aria-hidden="true" /></Link>
    </div>
    <div className="homa-editorial-hero-bottom">
      <span>{t('landing.editorial.heroDisclosure')}</span>
      <a href="#design-to-shop" aria-label={t('landing.experience.hero.explore')}><ArrowDown size={24} strokeWidth={1.2} /></a>
      <span className="homa-editorial-signature" aria-hidden="true">HOMA</span>
    </div>
  </section>;
}
