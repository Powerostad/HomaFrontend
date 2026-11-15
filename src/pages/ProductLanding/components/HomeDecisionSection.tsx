import { useState } from 'react';
import { ArrowLeft, RectangleHorizontal, Check, LampCeiling, Blinds, ShoppingBag, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OptimizedImage } from '@/components/OptimizedImage';
import { homepageMedia } from './homepageMedia';

const stages = ['design', 'choose', 'shop'] as const;
const items = [
  { id: 'rug', Icon: RectangleHorizontal, x: 43, y: 78 },
  { id: 'light', Icon: LampCeiling, x: 52, y: 12 },
  { id: 'curtain', Icon: Blinds, x: 64, y: 27 },
] as const;

export function HomeDecisionSection({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<typeof stages[number]>('design');
  const [selectedItem, setSelectedItem] = useState<typeof items[number]['id']>('rug');
  return (
    <section id="design-to-shop" className="homa-home-commerce homa-home-shell" aria-labelledby="homa-decision-title">
      <header className="homa-home-section-header">
        <div>
          <p className="homa-home-eyebrow">{t('landing.experience.commerce.eyebrow')}</p>
          <h2 id="homa-decision-title">{t('landing.experience.commerce.title')}<br /><span>{t('landing.experience.commerce.accent')}</span></h2>
        </div>
        <p>{t('landing.experience.commerce.description')}</p>
      </header>
      <div className="homa-home-workspace">
        <div className="homa-home-workspace-visual">
          <OptimizedImage src={homepageMedia.living.after} alt={t('landing.experience.commerce.imageAlt')} lazy />
          <span className="homa-home-demo-label">{t('landing.experience.commerce.demoLabel')}</span>
          {stage === 'choose' && items.map(item => (
            <button key={item.id} type="button" className="homa-home-hotspot" style={{ left: item.x + '%', top: item.y + '%' }}
              aria-pressed={selectedItem === item.id} aria-label={t('landing.experience.items.' + item.id + '.title')}
              onClick={() => setSelectedItem(item.id)}>
              <Plus size={17} aria-hidden="true" />
            </button>
          ))}
          <div className="homa-home-visual-note"><span>{t('landing.experience.commerce.room')}</span><span>{t('landing.experience.commerce.preview')}</span></div>
        </div>
        <div className="homa-home-workspace-panel">
          <div className="homa-home-stage-switch" role="group" aria-label={t('landing.experience.commerce.stageLabel')}>
            {stages.map(value => <button type="button" key={value} aria-pressed={stage === value} onClick={() => setStage(value)}>{t('landing.experience.stages.' + value)}</button>)}
          </div>
          <div className="homa-home-workspace-content" aria-live="polite">
            <h3>{t('landing.experience.panels.' + stage + '.title')}</h3>
            <p>{t('landing.experience.panels.' + stage + '.description')}</p>
            {stage === 'design' && (
              <div className="homa-home-design-note">
                <span>{t('landing.experience.panels.design.promptLabel')}</span>
                <p>{t('landing.experience.panels.design.prompt')}</p>
                <div><Check size={16} aria-hidden="true" />{t('landing.experience.panels.design.keep')}</div>
              </div>
            )}
            {stage === 'choose' && (
              <div className="homa-home-item-options">
                {items.map(({ id, Icon }) => <button type="button" key={id} aria-pressed={selectedItem === id} onClick={() => setSelectedItem(id)}>
                  <span className="homa-home-item-icon"><Icon size={23} strokeWidth={1.25} aria-hidden="true" /></span>
                  <span><strong>{t('landing.experience.items.' + id + '.title')}</strong><small>{t('landing.experience.items.' + id + '.detail')}</small></span>
                  {selectedItem === id && <Check size={15} aria-hidden="true" />}
                </button>)}
                <p className="homa-home-item-explanation">{t('landing.experience.items.' + selectedItem + '.reason')}</p>
              </div>
            )}
            {stage === 'shop' && <div className="homa-home-shopping-note">
              <ShoppingBag size={28} strokeWidth={1.2} aria-hidden="true" />
              <p>{t('landing.experience.panels.shop.summary')}</p>
              <ul><li>{t('landing.experience.panels.shop.price')}</li><li>{t('landing.experience.panels.shop.seller')}</li></ul>
            </div>}
          </div>
          <div className="homa-home-workspace-bottom">
            <p>{t('landing.experience.commerce.realProject')}</p>
            <Link to="/studio" onClick={onStudioStart} className="homa-home-text-link">{t('landing.experience.commerce.cta')}<ArrowLeft size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
