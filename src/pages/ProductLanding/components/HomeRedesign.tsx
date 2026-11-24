import { useState } from 'react';
import { ArrowLeft, ArrowDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { homepageMedia } from './homepageMedia';
import { HomeFaq } from './HomeFaq';
import { HomeJournal } from './HomeJournal';
import './editorial-home.css';
import './redesign-home.css';

type Props = { onStudioStart?: () => void };

export function HomeRedesign({ onStudioStart }: Props) {
  const { t } = useTranslation();
  const copy = (key: string) => t('landing.redesign.' + key);
  const [selected, setSelected] = useState('rug');
  const [view, setView] = useState<'before' | 'after'>('after');
  const start = (label = copy('start'), to = '/studio') => <Link className="hm-action" to={to} onClick={onStudioStart}>{label}<ArrowLeft size={20} aria-hidden="true" /></Link>;
  return <div className="hm-design">
    <section className="hm-hero" aria-labelledby="hm-title">
      <div className="hm-hero-copy"><h1 id="hm-title">{copy('hero')}<span>{copy('heroAccent')}</span></h1><p className="hm-lead">{copy('promise')}</p><p>{copy('intro')}</p><div className="hm-actions">{start()}<a href="#design-to-shop" className="hm-link">{copy('explore')}<ArrowDown size={18} /></a></div></div>
      <figure className="hm-hero-media"><img src="/images/home-editorial/hero.webp" alt={copy('heroAlt')} {...{ fetchpriority: 'high' }} /><figcaption>{t('landing.editorial.heroDisclosure')}</figcaption></figure>
    </section>

    <section className="hm-manifest hm-wrap"><h2>{copy('manifest')}<span>{copy('manifestAccent')}</span></h2><p>{copy('manifestBody')}</p></section>

    <section id="design-to-shop" className="hm-story hm-wrap" aria-labelledby="hm-story-title">
      <header><span className="hm-index">{copy('designLabel')}</span><h2 id="hm-story-title">{copy('story')}<br />{copy('storyAccent')}</h2><p>{copy('storyBody')}</p><a className="hm-link" href="#home-shopping">{copy('shopLink')}<ArrowLeft size={18} /></a></header>
      <figure><div className="hm-comparison"><BeforeAfterSlider beforeImage={homepageMedia.living.before} afterImage={homepageMedia.living.after} lazy /></div><figcaption>{t('landing.experience.visualDisclosure')}<span>{t('landing.home.compareHint')}</span></figcaption></figure>
    </section>

    <section id="how-it-works" className="hm-process hm-wrap"><h2>{copy('flow')}</h2><ol>{['photo','design','choose','buy'].map((key, index) => <li key={key}><span className="hm-index">0{index + 1}</span><h3>{copy(key + 'Title')}</h3><p>{copy(key + 'Body')}</p></li>)}</ol></section>

    <section className="hm-preserve hm-wrap" id="home-refine"><figure><img src={homepageMedia.rug[view]} loading="lazy" alt={copy('rugAlt')} /><div className="hm-view-controls" role="group" aria-label={copy('compare')}>
      {(['before','after'] as const).map(value => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{t('tryOn.result.' + value)}</button>)}
      </div><figcaption>{t('landing.experience.visualDisclosure')}</figcaption></figure><div><span className="hm-index">{copy('preserveLabel')}</span><h2>{copy('preserve')}<span>{copy('preserveAccent')}</span></h2><p>{copy('preserveBody')}</p><blockquote>{copy('prompt')}</blockquote>{start(copy('bedroom'), '/studio?room=bedroom')}</div></section>

    <section className="hm-shopping" id="home-shopping"><div className="hm-wrap"><header><span className="hm-index">{copy('shopLabel')}</span><h2>{copy('shopTitle')}</h2><p>{copy('shopBody')}</p></header><div className="hm-shopping-layout"><div className="hm-shopping-copy"><div className="hm-choices" role="group" aria-label={copy('chooseElement')}>{['rug','light','curtain'].map(key => <button type="button" key={key} aria-pressed={selected === key} onClick={() => setSelected(key)}><span>{copy(key)}</span><Plus size={20} aria-hidden="true" /></button>)}</div><div className="hm-choice-detail" aria-live="polite"><h3>{copy(selected + 'Heading')}</h3><p>{copy(selected + 'Reason')}</p></div><p className="hm-shopping-note">{copy('seller')}</p>{start(copy('ownProducts'))}</div><figure className="hm-hotspot-image"><img src={homepageMedia.living.after} alt={copy('roomAlt')} loading="lazy" />{['rug','light','curtain'].map(key => <button key={key} type="button" className={'hm-hotspot hm-hotspot-' + key} aria-label={copy(key)} aria-pressed={selected === key} onClick={() => setSelected(key)}><Plus size={20} aria-hidden="true" /></button>)}<figcaption>{copy('concept')}</figcaption></figure></div></div></section>

    <section className="hm-refine hm-wrap"><span className="hm-index">{copy('refineLabel')}</span><h2>{copy('refineTitle')}</h2><p>{copy('refineBody')}</p><div className="hm-prompts">{['promptOne','promptTwo','promptThree'].map(key => <Link key={key} to="/studio" onClick={onStudioStart}>{copy(key)}<ArrowLeft size={18} aria-hidden="true" /></Link>)}</div><small>{copy('promptHint')}</small></section>
    <HomeFaq onStudioStart={onStudioStart} />
    <HomeJournal />
  </div>;
}
