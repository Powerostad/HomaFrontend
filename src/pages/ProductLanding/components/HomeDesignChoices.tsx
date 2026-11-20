import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, ChevronsLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './home-design-choices.css';

const media = (name: string) => `/images/home-story/${name}.webp`;
const examples = [
  { key: 'wardrobe', photo: 'wardrobe', ratio: 1122 / 1402, split: 28, source: 'https://arayantarsim.com/services/wall-closet' },
  { key: 'bathroom', photo: 'bathroom-wide', ratio: 1, split: 50, source: 'https://caspiancabinet.com/product-category/ست-آینه-و-باکس-روشویی/wood/' },
  { key: 'curtain', photo: 'curtain', ratio: 1, split: 50, source: 'https://evimdecor.com/product/solid-milky-silk-curtain' },
  { key: 'wallpaper', photo: 'wallpaper-room', ratio: 736 / 946, split: 20, source: 'https://extreme-walls.com/product/atom-wallpaper-6059/' },
] as const;

type Example = (typeof examples)[number];
function RoomComparison({ example }: { example: Example }) {
  const { t } = useTranslation();
  const [split, setSplit] = useState<number>(example.split);
  const photo = (side: string) => media(example.photo + '-' + side);
  const describe = (side: string) => t(`landing.choices.${example.key}.${side}`);
  const compareLabel = t('landing.home.compareLabel') + ' — ' + t(`landing.choices.${example.key}.name`);
  function moveDivider(event: PointerEvent<HTMLInputElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width) setSplit(Math.round(100 * Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))));
  }
  return (
    <div className="hdc-viewer" style={{ '--hdc-ratio': example.ratio } as CSSProperties}>
      <div className="hdc-photo" dir="ltr">
        <img src={photo('after')} alt={describe('after')} loading="lazy" />
        <img className="hdc-original" src={photo('before')} alt={describe('before')}
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
        {split > 14 && <small className="hdc-before">{t('tryOn.result.before')}</small>}
        {split < 85 && <small className="hdc-after">{t('landing.choices.after')}</small>}
        <span className="hdc-divider" style={{ left: split + '%' }} aria-hidden="true"><ChevronsLeftRight size={18} /></span>
        <input className="hdc-range" dir="ltr" type="range" min="0" max="100" value={split}
          aria-label={compareLabel} onChange={e => setSplit(e.currentTarget.valueAsNumber)}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            event.currentTarget.setPointerCapture(event.pointerId);
            moveDivider(event);
          }}
          onPointerMove={event => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) moveDivider(event);
          }} />
      </div>
    </div>
  );
}

export function HomeDesignChoices({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 570px)');
    let frame = 0;
    function update() {
      frame = 0;
      reduced.current = query.matches;
      const node = track.current;
      if (!node) return;
      const bounds = node.getBoundingClientRect();
      const distance = node.offsetHeight - (node.firstElementChild?.clientHeight ?? 0);
      setPinned(!query.matches && bounds.top <= 1 && bounds.top >= -distance);
      if (!query.matches && distance > 0) {
        const step = Math.floor(-bounds.top / distance * examples.length);
        setActive(Math.max(0, Math.min(examples.length - 1, step)));
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    if (window.location.hash === '#home-shopping') section.current?.scrollIntoView({ behavior: 'instant' });
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    query.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      query.removeEventListener('change', schedule);
    };
  }, []);

  function selectExample(index: number) {
    const node = track.current;
    setActive(index);
    if (!node || reduced.current) return;
    const travel = node.offsetHeight - (node.firstElementChild?.clientHeight ?? 0);
    const top = window.scrollY + node.getBoundingClientRect().top;
    window.scrollTo({ top: top + travel * (index + 0.25) / examples.length, behavior: 'instant' });
  }

  const selected = examples[active];
  const text = (key: string) => t('landing.choices.' + key);
  const detail = (key: string) => text(selected.key + '.' + key);
  const Arrow = i18n.dir() === 'rtl' ? ArrowLeft : ArrowRight;
  return <section ref={section} className="hdc" id="home-shopping" aria-labelledby="hdc-title">
    <header className="hdc-head">
      <h2 id="hdc-title">{text('heading')}</h2>
      <p>{text('intro')}</p>
      <Link to="/studio" onClick={onStudioStart}>{text('start')} <Arrow size={16} aria-hidden="true" /></Link>
    </header>
    <div className="hdc-track" ref={track} data-pinned={pinned}>
      <div className="hdc-stage">
        <article className="hdc-project" data-example={selected.key} aria-labelledby="hdc-question">
          <div className="hdc-copy">
            <div className="hdc-selector" role="group" aria-label={text('selector')}>
              {examples.map((example, index) => <button type="button" key={example.key}
                aria-pressed={active === index} aria-controls="hdc-content"
                onClick={() => selectExample(index)}>{text(example.key + '.name')}</button>)}
            </div>
            <div className="hdc-content" id="hdc-content">
              <h3 id="hdc-question">{detail('question')}</h3>
              <p>{detail('answer')}</p>
              <a className="hdc-source" href={selected.source} target="_blank" rel="noopener noreferrer">
                <span className="hdc-sample" aria-hidden="true" style={{ backgroundImage: `url(${media(selected.photo + '-after')})` }} />
                <span><strong>{detail('item')}</strong><small>{detail('seller')}</small></span>
                <Arrow size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
          <RoomComparison key={selected.key} example={selected} />
        </article>
      </div>
    </div>
    <small className="hdc-note">{text('sample')}</small>
  </section>;
}
