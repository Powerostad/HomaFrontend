import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function HomeFaq({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  return <section id="home-faq" className="homa-editorial-faq" aria-labelledby="homa-home-faq-title">
    <div className="homa-home-shell">
      <header><p className="homa-home-eyebrow">{t('landing.experience.faq.eyebrow')}</p><h2 id="homa-home-faq-title">{t('landing.experience.faq.title')}</h2></header>
      <div className="homa-home-questions">{['start', 'buy', 'cost', 'accuracy'].map(key => <details key={key}><summary>{t('landing.experience.faq.' + key + '.question')}<Plus size={27} strokeWidth={1.1} aria-hidden="true" /></summary><p>{t('landing.experience.faq.' + key + '.answer')}</p></details>)}</div>
      <a href="/support" className="homa-home-text-link">{t('landing.experience.faq.support')}<ArrowLeft size={20} /></a>
      <div className="homa-editorial-closing"><h2>{t('landing.experience.closing.title')}</h2><Link to="/studio" onClick={onStudioStart} className="homa-home-button">{t('landing.experience.start')}<ArrowLeft size={21} /></Link></div>
    </div>
  </section>;
}
