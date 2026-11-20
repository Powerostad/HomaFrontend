import { useTranslation } from 'react-i18next';

const steps = [
  { key: 'design', image: '/images/prop/before.webp' },
  { key: 'choose', image: '/images/studio/loading-v5/after.webp' },
  { key: 'shop', image: '/images/comparison/rug/after.webp' },
];
export function HomeJourney() {
  const { t, i18n } = useTranslation();
  return <section id="how-it-works" className="homa-editorial-journey" aria-labelledby="homa-home-flow-title">
    <div className="homa-home-shell homa-editorial-journey-layout">
      <header>
        <p className="homa-home-eyebrow">{t('landing.experience.flow.eyebrow')}</p>
        <h2 id="homa-home-flow-title">{['design', 'choose', 'shop'].map(key => <span key={key}>{t('landing.editorial.journey.' + key)}</span>)}</h2>
        <p>{t('landing.experience.flow.description')}</p>
      </header>
      <ol>{steps.map(({ key, image }, index) => <li key={key}>
        <span className="homa-editorial-step-number">{new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2 }).format(index + 1)}</span>
        <div><h3>{t('landing.experience.flow.' + key + '.title')}</h3><p>{t('landing.experience.flow.' + key + '.description')}</p></div>
        <img src={image} alt="" loading="lazy" decoding="async" />
      </li>)}</ol>
    </div>
  </section>;
}
