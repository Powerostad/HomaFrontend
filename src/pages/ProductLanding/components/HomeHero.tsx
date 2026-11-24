import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HomeHeroVideo } from './HomeHeroVideo';
import './home-hero.css';

const slides = [
  { key: 'home', image: '/images/home-editorial/hero-desktop-poster.webp', href: '/studio' },
  { key: 'bedroom', image: '/images/home-hero/bedroom-after.webp', before: '/images/home-hero/bedroom-before.webp', href: '/studio?room=bedroom' },
  { key: 'living', image: '/images/home-hero/living-after.webp', before: '/images/home-hero/living-before.webp', href: '/studio' },
  { key: 'cabin', image: '/images/home-hero/cabin-after.webp', before: '/images/home-hero/cabin-before.webp', href: '/hosts' },
];

export function HomeHero({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const [before, setBefore] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const slide = slides[index];
  const rtl = i18n.dir() === 'rtl';
  const text = (key: string) => t('landing.heroGallery.' + key);
  const select = (next: number) => {
    setIndex((next + slides.length) % slides.length);
    setBefore(false);
  };
  return <section className="hh-hero" data-slide={slide.key} role="region" aria-roledescription={text('carousel')} aria-label={text('label')}
    onTouchStart={event => {
      if ((event.target as HTMLElement).closest('button,a')) return;
      touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }}
    onTouchEnd={event => {
      const origin = touch.current;
      touch.current = null;
      if (!origin) return;
      const dx = event.changedTouches[0].clientX - origin.x;
      const dy = event.changedTouches[0].clientY - origin.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) select(index + (dx > 0 ? 1 : -1) * (rtl ? 1 : -1));
    }}>
    <div className="hh-media" aria-hidden="true">
      <picture key={slide.key + before}>
        {index === 0 && <source media="(max-width: 700px)" srcSet="/images/home-editorial/hero-mobile-poster.webp" />}
        <img src={before && slide.before ? slide.before : slide.image} alt=""
          {...(index === 0 ? { fetchpriority: 'high' } : {})} />
      </picture>
    </div>
    {index === 0 && <HomeHeroVideo />}
    <div className="hh-content" aria-live="polite" aria-atomic="true">
      <h1>{index === 0 ? t('landing.scroll.headline') : text(slide.key + '.title')}</h1>
      <p>{index === 0 ? t('landing.scroll.intro') : text(slide.key + '.body')}</p>
      {index === 0 && <p className="hh-tagline">{t('landing.scroll.tagline')}</p>}
      <div className="hh-actions">
        <Link className="hh-cta" to={slide.href} onClick={slide.href.startsWith('/studio') ? onStudioStart : undefined}>
          {index === 0 ? t('landing.redesign.start') : text(slide.key + '.cta')}
          {rtl ? <ArrowLeft size={20} aria-hidden="true" /> : <ArrowRight size={20} aria-hidden="true" />}
        </Link>
        {index === 0 && <a className="hh-example-link" href="#how-it-works">
          {t('landing.studioPath.viewExample')}<ArrowDown size={16} aria-hidden="true" />
        </a>}
      </div>
    </div>
    {slide.before && <div className="hh-comparison" role="group" aria-label={text('compare')}>
      <button type="button" aria-pressed={before} onClick={() => setBefore(true)}>{t('tryOn.result.before')}</button>
      <button type="button" aria-pressed={!before} onClick={() => setBefore(false)}>{t('tryOn.result.after')}</button>
    </div>}
    <div className="hh-bottom">
      <div className="hh-slides" role="group" aria-label={text('choose')}>
        {slides.map((item, n) => <button key={item.key} type="button" aria-pressed={index === n} onClick={() => select(n)}><span aria-hidden="true">0{n + 1}</span>{text(item.key + '.label')}</button>)}
      </div>
      <div className="hh-arrows">
        <button type="button" aria-label={text('previous')} onClick={() => select(index - 1)}>{rtl ? <ArrowRight aria-hidden="true" /> : <ArrowLeft aria-hidden="true" />}</button>
        <button type="button" aria-label={text('next')} onClick={() => select(index + 1)}>{rtl ? <ArrowLeft aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}</button>
      </div>
    </div>
  </section>;
}
