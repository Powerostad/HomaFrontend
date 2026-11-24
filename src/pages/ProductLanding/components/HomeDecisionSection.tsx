import { ArrowLeft, MoveHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { homepageMedia } from './homepageMedia';

export function HomeDecisionSection({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  return <section id="design-to-shop" className="homa-home-commerce homa-home-shell" aria-labelledby="homa-decision-title">
    <header className="homa-home-section-header">
      <h2 id="homa-decision-title">{t('landing.experience.commerce.title')}<br /><span>{t('landing.experience.commerce.accent')}</span></h2>
      <p>{t('landing.experience.commerce.description')}</p>
    </header>
    <figure className="homa-editorial-comparison">
      <div className="homa-editorial-comparison-image">
        <BeforeAfterSlider beforeImage={homepageMedia.living.before} afterImage={homepageMedia.living.after} lazy />
        <div className="homa-home-image-labels" aria-hidden="true"><span>{t('tryOn.result.after')}</span><span>{t('tryOn.result.before')}</span></div>
      </div>
      <figcaption><span>{t('landing.experience.visualDisclosure')}</span><span><MoveHorizontal size={18} />{t('landing.home.compareHint')}</span></figcaption>
    </figure>
    <Link to="/studio" onClick={onStudioStart} className="homa-home-text-link">{t('landing.experience.commerce.cta')}<ArrowLeft size={20} /></Link>
  </section>;
}
