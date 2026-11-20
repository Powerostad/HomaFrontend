import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '@/components/OptimizedImage';

export function HomeJournal() {
  const { t } = useTranslation();
  return <section id="home-examples" className="homa-editorial-journal homa-home-shell" aria-labelledby="homa-home-examples-title">
    <header><p className="homa-home-eyebrow">{t('landing.experience.examples.eyebrow')}</p><h2 id="homa-home-examples-title">{t('landing.editorial.journalTitle')}</h2><a href="/blog/" className="homa-home-text-link">{t('landing.experience.examples.all')}<ArrowLeft size={21} /></a></header>
    <div className="homa-editorial-journal-spread">
      <a className="homa-editorial-journal-lead" href="/blog/rug-size-before-pattern"><figure><OptimizedImage src="/images/comparison/rug/after.jpg" alt={t('landing.home.guides.rug')} lazy /><figcaption>{t('landing.experience.examples.imageLabel')}</figcaption></figure><h3>{t('landing.home.guides.rug')}<ArrowLeft size={24} /></h3></a>
      <a className="homa-editorial-journal-side" href="/blog/choose-curtains-for-your-room"><figure><OptimizedImage src="/images/prop/after.jpg" alt={t('landing.home.guides.curtain')} lazy /><figcaption>{t('landing.experience.examples.imageLabel')}</figcaption></figure><h3>{t('landing.home.guides.curtain')}<ArrowLeft size={24} /></h3></a>
    </div>
    <a className="homa-editorial-journal-reading" href="/blog/cozy-bedroom-without-new-bed">{t('landing.home.guides.bedroom')}<ArrowLeft size={20} /></a>
  </section>;
}
