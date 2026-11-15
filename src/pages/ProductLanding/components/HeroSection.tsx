import { ArrowDown, ArrowLeft, MoveHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { homepageMedia } from './homepageMedia';
import './homepage.css';

export function HeroSection({ onGetStarted }: { onGetStarted?: () => void }) {
  const { t } = useTranslation();
  return (
    <section className="homa-home-hero homa-home-shell" aria-labelledby="homa-home-title">
      <div className="homa-home-hero-top">
        <div>
          <p className="homa-home-eyebrow">{t('landing.experience.hero.eyebrow')}</p>
          <h1 id="homa-home-title">
            {t('landing.experience.hero.title')}<br />
            <span>{t('landing.experience.hero.accent')}</span>
          </h1>
        </div>
        <div className="homa-home-hero-intro">
          <p>{t('landing.experience.hero.description')}</p>
          <Link to="/studio" onClick={onGetStarted} className="homa-home-button">
            {t('landing.experience.start')}<ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <a href="#design-to-shop" className="homa-home-text-link">{t('landing.experience.hero.explore')}<ArrowDown size={15} aria-hidden="true" /></a>
        </div>
      </div>
      <figure className="homa-home-hero-figure">
        <div className="homa-home-hero-image">
          <BeforeAfterSlider beforeImage={homepageMedia.living.before} afterImage={homepageMedia.living.after} priority />
          <div className="homa-home-image-labels" aria-hidden="true">
            <span>{t('tryOn.result.after')}</span><span>{t('tryOn.result.before')}</span>
          </div>
          <a href="#design-to-shop" className="homa-home-photo-link"><span>{t('landing.experience.hero.photoLink')}</span><ArrowLeft size={18} aria-hidden="true" /></a>
        </div>
        <figcaption>
          <span>{t('landing.experience.visualDisclosure')}</span>
          <span><MoveHorizontal size={15} aria-hidden="true" />{t('landing.home.compareHint')}</span>
        </figcaption>
      </figure>
    </section>
  );
}