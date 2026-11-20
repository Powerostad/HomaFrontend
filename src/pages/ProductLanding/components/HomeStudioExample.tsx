import { ArrowLeft, ArrowRight, Armchair, BedDouble, Blinds, Flower2, Frame, Lamp, Lightbulb, Package, Square, Table2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HeroImageStage } from '@/pages/Studio/result/HeroImagePanel';
import '@/pages/Studio/result/studio-result.css';
import './home-studio-example.css';

const shoppingItems = [
  { key: 'rug', Icon: Square, x: 37, y: 81 },
  { key: 'curtains', Icon: Blinds, x: 83, y: 36 },
  { key: 'bedding', Icon: BedDouble, x: 63, y: 59 },
  { key: 'chair', Icon: Armchair, x: 14, y: 73 },
  { key: 'mirror', Icon: Frame, x: 7, y: 38 },
  { key: 'table', Icon: Table2, x: 83, y: 80 },
  { key: 'lamp', Icon: Lamp, x: 88, y: 68 },
  { key: 'pendant', Icon: Lightbulb, x: 41, y: 6 },
  { key: 'plants', Icon: Flower2, x: 20, y: 52 },
  { key: 'accessories', Icon: Package, x: 10, y: 88 },
] as const;

type ShoppingItem = (typeof shoppingItems)[number];

const cabinResult = '/images/home-hero/cabin-after.webp';
const thumbnailScale = 5;
const thumbnailHeightScale = thumbnailScale * 3 / 4;

// Align each square thumbnail to the same point as its marker in the 4:3 photo.
function cropPosition(point: number, scale: number) {
  return `${Math.min(100, Math.max(0, (point * scale - 50) / (scale - 1)))}%`;
}

export function HomeStudioExample({ onStudioStart }: { onStudioStart?: () => void }) {
  const { t, i18n } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const text = (key: string) => t(`landing.studioExample.${key}`);
  const Arrow = i18n.dir() === 'rtl' ? ArrowLeft : ArrowRight;
  const studioLink = (
    <Link className="hs-studio-link" to="/studio" onClick={onStudioStart}>
      {t('landing.scroll.openStudio')}<Arrow size={16} aria-hidden="true" />
    </Link>
  );

  function selectItem(item: ShoppingItem) {
    if (selectedItem?.key === item.key) {
      setSelectedItem(null);
      return;
    }
    setShowOriginal(false);
    setSelectedItem(item);
    const photo = photoRef.current;
    if (photo) {
      const { top, height } = photo.getBoundingClientRect();
      const markerTop = top + height * item.y / 100;
      const headerBottom = document.querySelector('.homa-editorial-header')?.getBoundingClientRect().bottom ?? 0;
      if (markerTop - 18 < Math.max(0, headerBottom) || markerTop + 18 > window.innerHeight) {
        photo.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    }
  }

  return (
    <section id="how-it-works" className="hs-studio" aria-labelledby="hs-studio-title">
      <header className="hs-studio-intro">
        <h2 id="hs-studio-title">
          <span>{text('previewTitle')}</span>{' '}
          <span className="hs-studio-title-accent">{text('previewTitleAccent')}</span>
        </h2>
        <p>{text('previewBody')}</p>
        {studioLink}
      </header>
      <figure className="hs-studio-frame">
        <figcaption className="hs-studio-bar">
          <strong>{text('project')}</strong>
          <span>{text('sample')}</span>
        </figcaption>
        <div className="hs-studio-workspace">
          <div className="hs-studio-photo" id="hs-studio-photo" ref={photoRef}>
            <HeroImageStage embedded showActions={false} showOriginal={showOriginal}
              onToggleOriginal={value => {
                setShowOriginal(value);
                setSelectedItem(null);
              }}
              originalImage="/images/home-hero/cabin-before.webp"
              resultImage={cabinResult} />
            {!showOriginal && selectedItem && (
              <span className="hs-studio-photo-marker" aria-hidden="true"
                style={{ left: `${selectedItem.x}%`, top: `${selectedItem.y}%` }} />
            )}
          </div>
          <div className="hs-studio-detail">
            <div className="hs-studio-list">
              <h3>{text('shoppingList.title')}</h3>
              <p>{text('shoppingList.intro')}</p>
              <ul>
                {shoppingItems.map(item => {
                  const { key, Icon } = item;
                  return (
                    <li key={key}>
                      <button className="hs-studio-item-compact" type="button"
                        aria-controls="hs-studio-photo" aria-pressed={selectedItem?.key === key}
                        onClick={() => selectItem(item)}>
                          <span className="hs-studio-thumb" aria-hidden="true" style={{
                            backgroundImage: `url(${cabinResult})`,
                            backgroundSize: `${thumbnailScale * 100}% auto`,
                            backgroundPosition: `${cropPosition(item.x, thumbnailScale)} ${cropPosition(item.y, thumbnailHeightScale)}`,
                          }} />
                          <span>{text(`shoppingList.compactItems.${key}`)}</span>
                      </button>
                      {key === 'rug'
                        ? <img src="/images/home-hero/studio-sample-lohals.webp" loading="lazy" width={32} height={36} alt="" />
                        : <Icon size={20} strokeWidth={1.4} aria-hidden="true" />}
                      <span className="hs-studio-item-full">{text(`shoppingList.items.${key}`)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </figure>
      <div className="hs-studio-mobile-action">{studioLink}</div>
    </section>
  );
}
