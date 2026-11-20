import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ChevronsLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toLocalizedDigits } from '@/utils/formatters';
import './home-before-buying.css';

const chapters = [
  { key: 'thought', id: 'buying-problem', image: 'thought', height: 1086 },
  { key: 'search', id: 'shopping-confusion', image: 'showroom', height: 965 },
  { key: 'assistant', id: 'design-steps', image: 'photo', height: 1086 },
  { key: 'design', id: 'design-for-you', image: 'result', height: 1086 },
  { key: 'result', id: 'design-to-purchase', image: 'result', height: 1086 },
] as const;
const lastChapter = chapters.length - 1;
const looks = ['cream', 'rust', 'olive'] as const;
const sellerCategories = {
  sofa: 'اتاق-نشیمن/مبلمان',
  table: 'اتاق-نشیمن/میز-جلو-مبلی-و-عسلی',
  light: 'نور-و-روشنایی/لوستر',
};
type SofaColour = typeof looks[number];

// Paths trace only the upholstery in the two existing crops of the room.
const sofaOutline = {
  desktop: 'M240 323 L257 321 L259 299 Q260 292 266 292 L312 288 L365 285 L438 280 L445 281 L503 278 L527 281 L556 280 L692 311 Q702 312 701 321 L697 333 L710 335 L709 379 Q735 381 747 392 L747 416 L729 424 L726 439 L623 470 L481 389 L269 426 L251 407 Z',
  mobile: 'M128 570 L142 566 L145 556 L177 551 L218 545 L258 542 L281 543 L310 547 L331 547 L421 562 Q426 561 425 567 L422 577 L430 578 L430 605 Q446 607 454 613 L453 633 L443 638 L439 648 L374 665 L276 611 L149 636 L133 619 Z',
};

function SofaTint({ colour, thumbnail = false }: { colour: SofaColour; thumbnail?: boolean }) {
  if (thumbnail) return <svg viewBox="222 263 547 225" aria-hidden="true" className="hj-sofa-thumb">
    <image href="/images/home-story/journey-result-800.webp" width="800" height="600" />
    <path d={sofaOutline.desktop} data-tint={colour} />
  </svg>;
  if (colour === 'cream') return null;
  return <>{(['desktop', 'mobile'] as const).map(crop =>
    <svg key={crop} className={`hj-sofa-tint hj-tint-${crop}`} aria-hidden="true"
      viewBox={crop === 'desktop' ? '0 0 800 600' : '0 0 480 1014'} preserveAspectRatio="xMidYMid slice">
      <path d={sofaOutline[crop]} data-tint={colour} />
    </svg>
  )}</>;
}
const bound = (value: number) => Math.max(0, Math.min(1, value));

function RoomPhoto({ scene, alt, height }: { scene: string; alt: string; height: number }) {
  const path = `/images/home-story/journey-${scene}`;
  return <picture>
    <source media="(max-width: 899px)" srcSet={`${path}-mobile-480.webp 480w, ${path}-mobile-900.webp 900w`} sizes="100vw" />
    <img className="hj-photo" src={`${path}-1448.webp`} srcSet={`${path}-800.webp 800w, ${path}-1448.webp 1448w`}
      sizes="100vw" width={1448} height={height} alt={alt} loading="lazy" decoding="async" />
  </picture>;
}

/** A photographic ribbon: vertical scrolling moves the story horizontally. */
export function HomeBeforeBuying({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t, i18n } = useTranslation();
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const jump = useRef<(index: number) => void>(() => {});
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [colour, setColour] = useState<SofaColour>('cream');
  const [split, setSplit] = useState(50);
  const [enhanced, setEnhanced] = useState(false);
  const text = (key: string) => t(`landing.buyingJourney.${key}`);

  useEffect(() => {
    const node = section.current;
    const windowNode = viewport.current;
    const track = rail.current;
    if (!node || !windowNode || !track) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let enabled = false;
    const setMode = () => {
      const minHeight = window.innerWidth < 900 ? 720 : 540;
      enabled = !media.matches && window.innerHeight >= minHeight;
      setEnhanced(enabled);
      node.dataset.enhanced = String(enabled);
      if (enabled) windowNode.scrollLeft = 0;
      update();
    };
    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const sticky = node.querySelector<HTMLElement>('.hj-sticky')!;
      if (!enabled) {
        track.style.removeProperty('transform');
        node.style.removeProperty('--hj-panel-width');
        Array.from(track.children).forEach(panel => (panel as HTMLElement).style.removeProperty('--hj-copy-opacity'));
        return;
      }
      const progress = bound(-box.top / Math.max(1, node.offsetHeight - sticky.offsetHeight));
      const width = windowNode.clientWidth;
      const slant = parseFloat(getComputedStyle(node).getPropertyValue('--hj-slant'));
      // Chapters are laid out right-to-left; advance into the chapter on the left.
      node.style.setProperty('--hj-panel-width', `${width + slant}px`);
      const position = progress * lastChapter;
      const chapter = Math.min(lastChapter - 1, Math.floor(position));
      const fraction = bound((position - chapter - .2) / .6);
      const offset = chapter + fraction * fraction * (3 - 2 * fraction);
      track.style.transform = `translate3d(${width * offset}px,0,0)`;
      const entrance = bound((window.innerHeight * .65 - box.top) / (window.innerHeight * .3));
      Array.from(track.children).forEach((panel, index) => {
        const opacity = bound((.36 - Math.abs(offset - index)) / .26) * entrance;
        (panel as HTMLElement).style.setProperty('--hj-copy-opacity', String(opacity));
      });
      setActive(Math.min(lastChapter, Math.round(offset)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    jump.current = (index: number) => {
      const target = Math.max(0, Math.min(lastChapter, index));
      if (enabled) {
        const sticky = node.querySelector<HTMLElement>('.hj-sticky')!;
        window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top + (node.offsetHeight - sticky.offsetHeight) * target / lastChapter, behavior: 'instant' });
        update();
      } else {
        windowNode.scrollTo({ left: -windowNode.clientWidth * target, behavior: 'instant' });
        setActive(target);
      }
    };
    const navigateHash = (id: string) => {
      const index = id === 'before-buying' ? 0 : chapters.findIndex(chapter => chapter.id === id);
      if (index < 0) return false;
      if (!enabled) node.scrollIntoView({ behavior: 'instant', block: 'start' });
      jump.current(index);
      return true;
    };
    const hashChanged = () => navigateHash(window.location.hash.slice(1));
    const clicked = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!anchor || !navigateHash(anchor.hash.slice(1))) return;
      event.preventDefault();
      if (window.location.hash !== anchor.hash) window.history.pushState(null, '', anchor.hash);
    };
    const nativeScrolled = () => {
      if (enabled) return;
      setActive(Math.min(lastChapter, Math.round(Math.abs(windowNode.scrollLeft) / windowNode.clientWidth)));
    };
    setMode();
    hashChanged();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', setMode);
    window.addEventListener('hashchange', hashChanged);
    media.addEventListener('change', setMode);
    document.addEventListener('click', clicked);
    windowNode.addEventListener('scroll', nativeScrolled, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', setMode);
      window.removeEventListener('hashchange', hashChanged);
      media.removeEventListener('change', setMode);
      document.removeEventListener('click', clicked);
      windowNode.removeEventListener('scroll', nativeScrolled);
    };
  }, []);

  return <section className="hj-story" id="before-buying" ref={section} data-enhanced={enhanced}
    aria-label={text('title')}>
    <div className="hj-sticky">
      <div className="hj-window" ref={viewport} dir="rtl"
        onTouchStart={event => {
          touch.current = event.target instanceof HTMLInputElement ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }}
        onTouchEnd={event => {
          if (!enhanced || !touch.current) return;
          const dx = event.changedTouches[0].clientX - touch.current.x;
          const dy = event.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) jump.current(active + (dx > 0 ? 1 : -1));
          touch.current = null;
        }}>
        <ol className="hj-rail" ref={rail} role="list">
          {chapters.map(({ key, id, image, height }, index) => <li className="hj-panel" key={key} id={id} data-chapter={key} dir={i18n.dir()}>
            <div className="hj-room">
              <RoomPhoto scene={image} height={height} alt={text(`${key}.alt`)} />
              {(key === 'design' || key === 'result') && <SofaTint colour={colour} />}
            </div>
            {key === 'design' && <>
              <div className="hj-before-layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
                <RoomPhoto scene="photo" height={1086} alt={text('assistant.alt')} />
              </div>
              <div className="hj-wipe" dir="ltr">
                <span className="hj-side-label hj-side-before">{text('design.before')}</span>
                <span className="hj-side-label hj-side-after">{text('design.after')}</span>
                <span className="hj-wipe-line" style={{ left: `${split}%` }} aria-hidden="true"><ChevronsLeftRight size={18} /></span>
                <input type="range" min="0" max="100" value={split} aria-label={text('design.compare')}
                  tabIndex={active === index ? 0 : -1}
                  onPointerDown={event => {
                    if (!event.isPrimary || event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.focus({ preventScroll: true });
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setSplit(Math.round(bound((event.clientX - bounds.left) / bounds.width) * 100));
                  }}
                  onPointerMove={event => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                    const bounds = event.currentTarget.getBoundingClientRect();
                    setSplit(Math.round(bound((event.clientX - bounds.left) / bounds.width) * 100));
                  }}
                  onChange={event => setSplit(event.currentTarget.valueAsNumber)} />
              </div>
            </>}
            <div className="hj-copy">
              <span className="hj-label"><b dir="ltr">{toLocalizedDigits(`0${index + 1} / 0${chapters.length}`, i18n.language)}</b>{text(`${key}.label`)}</span>
              <h2>{text(`${key}.ribbon`)}</h2>
              {(key === 'assistant' || key === 'design') && <p>{text(`${key}.body`)}</p>}
            </div>
            {key === 'assistant' && <>
              <div className="hj-pin-layer" aria-hidden="true"><span className="hj-table-pin">{text('result.table')}</span></div>
              <aside className="hj-observation">
                <header><strong>{text('assistant.analysis')}</strong><small>{text('assistant.sample')}</small></header>
                <p>{text('assistant.notes.layout')}</p>
                <a href="#design-for-you" tabIndex={active === index ? 0 : -1}>{text('assistant.seeDesign')} <ArrowLeft size={16} aria-hidden="true" /></a>
              </aside>
            </>}
            {key === 'design' && <figure className="hj-looks">
              <figcaption>{text('design.layoutChange')}</figcaption>
              <span className="sr-only">{text('design.looks')}</span>
              <ul>{looks.map(look => <li key={look}><button type="button" aria-pressed={colour === look}
                tabIndex={active === index ? 0 : -1} onClick={() => {
                  setColour(look);
                  if (split > 65) setSplit(50);
                }}>
                <SofaTint colour={look} thumbnail />
                <span>{text(`design.${look}`)}</span>
              </button></li>)}</ul>
            </figure>}
            {key === 'result' && <aside className="hj-shopping">
              <header><h3>{text('result.picks')}</h3><small>{text('assistant.sample')}</small></header>
              <ul>{(['sofa', 'table', 'light'] as const).map(item => <li key={item}>
                <span>{text(`result.${item}`)}{item === 'sofa' && <> · {text(`design.${colour}`)}</>}</span>
                <a href={`https://zardaan.com/product-category/${sellerCategories[item]}/`}
                  target="_blank" rel="noopener noreferrer" tabIndex={active === index ? 0 : -1}>{text('result.atSeller')}</a>
              </li>)}</ul>
              <p>{text('result.plan')}</p>
            </aside>}
          </li>)}
        </ol>
      </div>
      <footer className="hj-footer">
        <nav className="hj-chapters" aria-label={text('navigation')}>
          {chapters.map(({ key, id }, index) => <a key={key} href={`#${id}`} aria-label={text(`${key}.label`)} aria-current={active === index ? 'step' : undefined}>
            {toLocalizedDigits(`0${index + 1}`, i18n.language)}
          </a>)}
        </nav>
        <Link to="/studio" className="hj-start" onClick={onStudioStart}>{text('designMyHome')}<ArrowLeft size={23} aria-hidden="true" /></Link>
        <span className="hj-hint"><ArrowDown size={16} aria-hidden="true" />{text('scroll')}</span>
        <div className="hj-arrows" dir="rtl">
          <button type="button" disabled={active === 0} onClick={() => jump.current(active - 1)} aria-label={text('previous')}><ArrowRight size={24} /></button>
          <button type="button" disabled={active === lastChapter} onClick={() => jump.current(active + 1)} aria-label={text('next')}><ArrowLeft size={24} /></button>
        </div>
      </footer>
    </div>
  </section>;
}
