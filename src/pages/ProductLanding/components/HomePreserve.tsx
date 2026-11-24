import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { homepageMedia } from './homepageMedia';

export function HomePreserve({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  return <section id="home-refine" className="homa-editorial-preserve homa-home-shell" aria-labelledby="homa-home-preserve-title">
    <figure><div className="homa-home-preserve-image"><BeforeAfterSlider beforeImage={homepageMedia.bedroom.before} afterImage={homepageMedia.bedroom.after} lazy /></div><figcaption>{t('landing.experience.visualDisclosure')}</figcaption></figure>
    <div className="homa-editorial-preserve-copy">
      <p className="homa-home-eyebrow">{t('landing.experience.preserve.eyebrow')}</p>
      <h2 id="homa-home-preserve-title">{t('landing.experience.preserve.title')}<br /><span>{t('landing.experience.preserve.accent')}</span></h2>
      <p>{t('landing.experience.preserve.description')}</p>
      <blockquote><span aria-hidden="true">“</span><p>{t('landing.experience.preserve.prompt')}</p></blockquote>
      <Link to="/studio?room=bedroom" onClick={onStudioStart} className="homa-home-text-link">{t('landing.experience.preserve.cta')}<ArrowLeft size={20} /></Link>
    </div>
  </section>;
}
