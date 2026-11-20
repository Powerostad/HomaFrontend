import { useEffect, useRef, useState } from 'react';
import { HomeDesignChoices } from './HomeDesignChoices';
import { useTranslation } from 'react-i18next';
import { HomeFaq } from './HomeFaq';
import { HomeHero } from './HomeHero';
import { HomeAccessories } from './HomeAccessories';
import { HomeBeforeBuying } from './HomeBeforeBuying';
import { HomeStudioExample } from './HomeStudioExample';
import { HomeStudioCost } from './HomeStudioPath';
import './editorial-home.css';
import './scroll-experience.css';

const bright = '/images/studio/loading-v5/after.webp';
const media = (name: string) => `/images/home-story/${name}.webp`;
const stages = ['/images/home-story/bedroom-original.jpg', bright, media('dark')];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
/** Observe native scrolling; never capture wheel or touch gestures. */
function useScrollProgress() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      setReduced(query.matches);
      const rect = node.getBoundingClientRect();
      setProgress(clamp(-rect.top / Math.max(1, rect.height - window.innerHeight)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    query.addEventListener('change', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); query.removeEventListener('change', schedule); };
  }, []);
  return { ref, progress, reduced };
}

/** A stepped, expanding aperture like the supplied transition screenshots. */
export function revealPolygon(progress: number) {
  const p = clamp(progress);
  const top = (1 - p) * 50;
  const bottom = 100 - top;
  const tooth = Math.min(2, top, p * 8);
  const upper: string[] = [];
  const lower: string[] = [];
  for (let x = 0; x < 100; x += 5) {
    upper.push(`${x}% ${top}%`, `${x + 2.5}% ${top}%`, `${x + 2.5}% ${top + tooth}%`, `${x + 5}% ${top + tooth}%`);
    lower.unshift(`${x + 5}% ${bottom - tooth}%`, `${x + 2.5}% ${bottom - tooth}%`, `${x + 2.5}% ${bottom}%`, `${x}% ${bottom}%`);
  }
  return `polygon(${[...upper, ...lower].join(',')})`;
}

export function HomeScrollExperience({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  const text = (key: string) => t('landing.scroll.' + key);
  const story = useScrollProgress();
  const first = clamp((story.progress - .12) / .32);
  const second = clamp((story.progress - .58) / .28);
  const step = second > .5 ? 2 : first > .5 ? 1 : 0;
  return <div className="hs-page">
    <HomeHero onStudioStart={onStudioStart} />
    <HomeBeforeBuying onStudioStart={onStudioStart} />
    <HomeStudioExample onStudioStart={onStudioStart} />

    <section id="design-to-shop" className="hs-story" ref={story.ref} data-step={story.reduced ? 2 : step} aria-label={text('storyLabel')}>
      <div className="hs-story-sticky">
        <img src={stages[story.reduced ? 2 : 0]} alt={text('roomAlt')} className="hs-scene" loading="lazy" decoding="async" />
        {!story.reduced && <>
          <img src={stages[1]} alt="" className="hs-scene hs-reveal" style={{ clipPath: revealPolygon(first), visibility: first === 0 ? 'hidden' : 'visible' }} />
          <img src={stages[2]} alt="" className="hs-scene hs-reveal" style={{ clipPath: revealPolygon(second), visibility: second === 0 ? 'hidden' : 'visible' }} />
        </>}
        <div className="hs-story-lines">
          {[1, first, second].map((progress, index) => {
            const visible = story.reduced || progress > .18;
            return (
              <p key={index} style={{ opacity: visible ? 1 : 0 }} aria-hidden={!visible}>
                <span>
                  <strong>{text(`line${index}`)}</strong>
                  <span className="hs-story-line-detail">{' '}{text(`line${index}Body`)}</span>
                </span>
              </p>
            );
          })}
        </div>
        <small className="hs-disclosure">{text('illustration')}</small>
      </div>
    </section>

    <HomeDesignChoices onStudioStart={onStudioStart} />
    <HomeAccessories />
    <HomeStudioCost />
    <HomeFaq onStudioStart={onStudioStart} />
    <nav className="hs-reading" aria-label={t('landing.experience.examples.all')}><a href="/blog/">{t('landing.experience.examples.all')}</a>{[['rug-size-before-pattern','rug'],['choose-curtains-for-your-room','curtain'],['cozy-bedroom-without-new-bed','bedroom']].map(([slug,key]) => <a key={slug} href={'/blog/' + slug}>{t('landing.home.guides.' + key)}</a>)}</nav>
  </div>;
}
