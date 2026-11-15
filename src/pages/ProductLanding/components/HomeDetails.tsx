import { ArrowLeft, Camera, SlidersHorizontal, ShoppingBag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '@/components/OptimizedImage';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { homepageMedia } from './homepageMedia';

const steps = [
  { key: 'design', Icon: Camera },
  { key: 'choose', Icon: SlidersHorizontal },
  { key: 'shop', Icon: ShoppingBag },
];
const examples = [
  { key: 'living', image: homepageMedia.living.after, href: '/blog/living-room-before-after' },
  { key: 'bedroom', image: homepageMedia.bedroom.after, href: '/blog/cozy-bedroom-without-new-bed' },
];
const questions = ['start', 'buy', 'cost', 'accuracy'] as const;

export function HomeDetails({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  return (
    <>
      <section id="how-it-works" className="homa-home-flow" aria-labelledby="homa-home-flow-title">
        <div className="homa-home-shell">
          <header className="homa-home-section-header">
            <div><p className="homa-home-eyebrow">{t('landing.experience.flow.eyebrow')}</p><h2 id="homa-home-flow-title">{t('landing.experience.flow.title')}</h2></div>
            <p>{t('landing.experience.flow.description')}</p>
          </header>
          <ol className="homa-home-flow-grid">
            {steps.map(({ key, Icon }) => <li key={key}>
              <Icon size={27} strokeWidth={1.15} aria-hidden="true" />
              <h3>{t('landing.experience.flow.' + key + '.title')}</h3>
              <p>{t('landing.experience.flow.' + key + '.description')}</p>
            </li>)}
          </ol>
        </div>
      </section>
      <section className="homa-home-preserve homa-home-shell" aria-labelledby="homa-home-preserve-title">
        <div className="homa-home-preserve-copy">
          <p className="homa-home-eyebrow">{t('landing.experience.preserve.eyebrow')}</p>
          <h2 id="homa-home-preserve-title">{t('landing.experience.preserve.title')}<br /><span>{t('landing.experience.preserve.accent')}</span></h2>
          <p>{t('landing.experience.preserve.description')}</p>
          <div className="homa-home-chat-example">
            <span>{t('landing.experience.preserve.promptLabel')}</span>
            <p>{t('landing.experience.preserve.prompt')}</p>
          </div>
          <Link to="/studio?room=bedroom" onClick={onStudioStart} className="homa-home-text-link">{t('landing.experience.preserve.cta')}<ArrowLeft size={17} aria-hidden="true" /></Link>
        </div>
        <figure>
          <div className="homa-home-preserve-image"><BeforeAfterSlider beforeImage={homepageMedia.bedroom.before} afterImage={homepageMedia.bedroom.after} lazy /></div>
          <figcaption>{t('landing.experience.visualDisclosure')}</figcaption>
        </figure>
      </section>
      <section id="home-examples" className="homa-home-examples homa-home-shell" aria-labelledby="homa-home-examples-title">
        <header className="homa-home-section-header">
          <div><p className="homa-home-eyebrow">{t('landing.experience.examples.eyebrow')}</p><h2 id="homa-home-examples-title">{t('landing.experience.examples.title')}</h2></div>
          <a href="/blog/" className="homa-home-text-link">{t('landing.experience.examples.all')}<ArrowLeft size={17} aria-hidden="true" /></a>
        </header>
        <div className="homa-home-examples-grid">
          {examples.map(example => <a href={example.href} key={example.key} className="homa-home-example">
            <div><OptimizedImage src={example.image} alt={t('landing.experience.examples.' + example.key + '.title')} lazy /><span>{t('landing.experience.examples.imageLabel')}</span></div>
            <h3>{t('landing.experience.examples.' + example.key + '.title')}<ArrowLeft size={21} strokeWidth={1.2} aria-hidden="true" /></h3>
            <p>{t('landing.experience.examples.' + example.key + '.description')}</p>
          </a>)}
        </div>
        <p className="homa-home-reading-links"><a href="/blog/rug-size-before-pattern">{t('landing.home.guides.rug')}</a><span aria-hidden="true">·</span><a href="/blog/choose-curtains-for-your-room">{t('landing.home.guides.curtain')}</a></p>
      </section>
      <section id="home-faq" className="homa-home-faq" aria-labelledby="homa-home-faq-title">
        <div className="homa-home-shell">
          <div className="homa-home-faq-copy">
            <p className="homa-home-eyebrow">{t('landing.experience.faq.eyebrow')}</p>
            <h2 id="homa-home-faq-title">{t('landing.experience.faq.title')}</h2>
            <p>{t('landing.experience.faq.description')}</p>
            <a href="/support" className="homa-home-text-link">{t('landing.experience.faq.support')}<ArrowLeft size={17} aria-hidden="true" /></a>
          </div>
          <div className="homa-home-questions">{questions.map(key => <details key={key}>
            <summary>{t('landing.experience.faq.' + key + '.question')}<Plus size={19} strokeWidth={1.2} aria-hidden="true" /></summary>
            <p>{t('landing.experience.faq.' + key + '.answer')}</p>
          </details>)}</div>
        </div>
        <div className="homa-home-start homa-home-shell">
          <div><p>{t('landing.experience.closing.eyebrow')}</p><h2>{t('landing.experience.closing.title')}</h2></div>
          <Link to="/studio" onClick={onStudioStart} className="homa-home-button">{t('landing.experience.start')}<ArrowLeft size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}