import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Blinds, Check, Info, Lamp, Pencil, Plus, RotateCcw, Search, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cabinRug } from '@/pages/ProductLanding/components/cabinSample';
import './studio-introduction.css';

const guestSeenKey = 'homa.studio.introduction.v4.seen';
const steps = ['concept', 'plan', 'shop', 'consult'] as const;
const planItems = [{ key: 'keep', Icon: Check }, { key: 'change', Icon: RotateCcw }, { key: 'add', Icon: Plus }] as const;
const products = [{ key: 'rug', Icon: Square }, { key: 'curtain', Icon: Blinds }, { key: 'lamp', Icon: Lamp }] as const;
const topics = [{ key: 'fabric', Icon: Search }, { key: 'revision', Icon: Pencil }, { key: 'budget', Icon: Info }] as const;
const cabinAfter = '/images/home-hero/cabin-after.webp';
type Product = typeof products[number]['key'];
type Topic = typeof topics[number]['key'];

export function StudioIntroduction({ autoOpen, accountId }: { autoOpen: boolean; accountId?: string }) {
  const { t, i18n } = useTranslation();
  const seenKey = accountId ? `homa.studio.introduction.v4.account.${accountId}` : guestSeenKey;
  const storage = () => accountId ? localStorage : sessionStorage;
  const [open, setOpen] = useState(() => {
    if (!autoOpen) return false;
    try { return storage().getItem(seenKey) !== 'yes'; } catch { return true; }
  });
  const [index, setIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [topic, setTopic] = useState<Topic>('revision');
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const rtl = i18n.dir() === 'rtl';
  const step = steps[index];
  const last = index === steps.length - 1;
  const label = (key: string) => t('studioIntro.' + key);
  const Next = rtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (content.current) content.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }, [index]);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) {
      setIndex(0);
      setProduct(null);
      setTopic('revision');
      return;
    }
    try { storage().setItem(seenKey, 'yes'); } catch { /* Storage is optional. */ }
  }

  function goTo(next: number) {
    if (next < 0 || next >= steps.length) return;
    setIndex(next);
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger className="studio-guide-link">{label('guide')}</DialogTrigger>
    <DialogContent className="studio-guide" dir={i18n.dir()}
      onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus(); }}
      onKeyDown={event => {
        if (event.target instanceof HTMLInputElement || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        goTo(index + ((event.key === 'ArrowLeft') === rtl ? 1 : -1));
      }}>
      <header className="studio-guide-meta">
        <p>{label('studio')} · {t('studioIntro.stepCount', {
          current: (index + 1).toLocaleString(i18n.language), total: steps.length.toLocaleString(i18n.language),
        })}</p>
        <div className="studio-guide-track" aria-hidden="true">
          {steps.map((key, n) => <span key={key} data-filled={n <= index} />)}
        </div>
      </header>

      <div className="studio-guide-scroll" ref={content}>
        <section className="sg-screen" data-step={step} key={step}>
          <div className="studio-guide-heading">
            <p className="sg-eyebrow">{label(step + '.eyebrow')}</p>
            <DialogTitle asChild><h2 tabIndex={-1} ref={heading} aria-live="polite">{label(step + '.title')}</h2></DialogTitle>
            <DialogDescription>{label(step + '.body')}</DialogDescription>
          </div>
          {step === 'concept' && <figure className="sg-visual sg-compare">
            <BeforeAfterSlider beforeImage="/images/home-hero/cabin-before.webp" afterImage={cabinAfter} />
            <figcaption dir="ltr">
              <span className="sg-pill" dir={i18n.dir()}>{label('proposal')}</span>
              <span className="sg-pill" dir={i18n.dir()}>{label('original')}</span>
            </figcaption>
          </figure>}
          {step === 'plan' && <div className="sg-grid">
            <figure className="sg-visual sg-room"><img src={cabinAfter} width="1448" height="1086" alt={label('afterAlt')} /></figure>
            <dl className="sg-plan">
              {planItems.map(({ key, Icon }) => <div key={key}>
                <span className="sg-plan-icon" aria-hidden="true"><Icon size={18} /></span>
                <div><dt>{label('plan.' + key)}</dt><dd>{label('plan.' + key + 'Detail')}</dd></div>
              </div>)}
            </dl>
          </div>}
          {step === 'shop' && <div className="sg-grid">
            <figure className="sg-visual sg-room sg-shop-room" id="sg-product-preview">
              <img src={cabinAfter} width="1448" height="1086" alt={label('afterAlt')} />
              {product === 'rug' && <span className="sg-rug-preview" aria-hidden="true"
                style={{ '--rug-photo': `url("${cabinRug.image}")` } as CSSProperties} />}
              {products.map(({ key, Icon }) => <span key={key} className={'sg-pin sg-pin-' + key}
                data-active={product === key} aria-hidden="true"><Icon size={16} /></span>)}
              {product && <figcaption className="sg-pill sg-image-status" role="status">
                {label(product === 'rug' ? 'shop.rugPreview' : 'shop.' + product)}
              </figcaption>}
            </figure>
            <ul className="sg-products" aria-label={label('shop.eyebrow')}>
              {products.map(({ key }) => <li key={key}>
                <button type="button" className="sg-product" aria-pressed={key === product} aria-controls="sg-product-preview"
                  onClick={() => setProduct(key === product ? null : key)}>
                  <img src={'/images/studio-introduction/' + key + '.jpg'} width="68" height="72" alt="" />
                  <span><b>{label('shop.' + key)}</b><small>{label(key === 'rug' ? 'shop.tryRug' : 'shop.locate')}</small></span>
                </button>
                {key === 'rug' && product === key && <a className="sg-seller" href={cabinRug.link} target="_blank" rel="noreferrer">
                  {label('shop.seller')} <bdi dir="ltr">{cabinRug.name}</bdi><ArrowUpRight size={14} aria-hidden="true" />
                </a>}
              </li>)}
            </ul>
          </div>}
          {step === 'consult' && <>
            <div className="sg-grid sg-consult">
              <div className="sg-chat" aria-label={label('consult.eyebrow')} aria-live="polite">
                <p className="sg-question">{label('consult.fabric')}</p>
                <p className="sg-answer"><b>{label('homa')}</b>{label('consult.fabricAnswer')}</p>
                {topic !== 'fabric' && <>
                  <p className="sg-question">{label('consult.' + topic)}</p>
                  <p className="sg-answer"><b>{label('homa')}</b>{label('consult.' + topic + 'Answer')}</p>
                </>}
              </div>
              <figure className="sg-visual sg-room">
                <img src={cabinAfter} width="1448" height="1086" alt={label('afterAlt')} />
                <figcaption className="sg-pill sg-image-status">{label('proposal')}</figcaption>
              </figure>
            </div>
            <div className="sg-topics" role="group" aria-label={label('consult.eyebrow')}>
              {topics.map(({ key, Icon }) => <button type="button" key={key} aria-pressed={topic === key} onClick={() => setTopic(key)}>
                <Icon size={16} aria-hidden="true" />{label('consult.' + key + 'Label')}
              </button>)}
            </div>
          </>}
          <p className="sg-note"><Info size={19} aria-hidden="true" />{label(step + '.note')}</p>
          {last && <p className="sg-credit">{label('guideCredit')}</p>}
        </section>
      </div>
      <footer className="studio-guide-footer">
        <div className="studio-guide-controls">
          <button type="button" className="studio-guide-start" onClick={() => last ? changeOpen(false) : goTo(index + 1)}>
            {label(last ? 'start' : 'next')}<Next size={18} aria-hidden="true" />
          </button>
          {index > 0 && <button type="button" className="studio-guide-back" onClick={() => goTo(index - 1)}>{label('back')}</button>}
        </div>
        <DialogClose className="studio-guide-skip">{label('skip')}</DialogClose>
      </footer>
    </DialogContent>
  </Dialog>;
}
