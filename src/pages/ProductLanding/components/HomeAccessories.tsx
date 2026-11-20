import { useTranslation } from 'react-i18next';
import './home-accessories.css';

const stories = [
  {
    id: 'accessories',
    title: 'landing.accessories.title',
    body: 'landing.accessories.body',
    photos: [
      { name: 'accessories-before', alt: 'landing.accessories.beforeAlt', label: 'tryOn.result.before' },
      { name: 'accessories-after', alt: 'landing.accessories.afterAlt', label: 'tryOn.result.after' },
    ],
  },
  {
    id: 'style',
    title: 'landing.accessories.style.title',
    body: 'landing.accessories.style.body',
    photos: [
      { name: 'style-classic', alt: 'landing.accessories.style.classicAlt', label: 'landing.accessories.style.classic' },
      { name: 'style-modern', alt: 'landing.accessories.style.modernAlt', label: 'landing.accessories.style.modern' },
    ],
  },
] as const;

export function HomeAccessories() {
  const { t } = useTranslation();
  return (
    <section id="home-accessories" className="hs-accessories" aria-labelledby="hs-accessories-title">
      <div className="hs-accessories-inner">
        {stories.map(story => (
          <article key={story.id} id={`home-${story.id}-story`}
            className="hs-accessories-story" data-story={story.id}
            aria-labelledby={`hs-${story.id}-title`}>
            <header className="hs-accessories-copy">
              <h2 id={`hs-${story.id}-title`}>{t(story.title)}</h2>
              <p>{t(story.body)}</p>
            </header>
            {story.photos.map((photo, index) => (
              <figure className={`hs-accessories-photo${index === 0 ? ' hs-accessories-stamp' : ''}`} key={photo.name}>
                <img src={`/images/home-story/${photo.name}.webp`} alt={t(photo.alt)}
                  loading="lazy" decoding="async" />
                <figcaption>{t(photo.label)}</figcaption>
              </figure>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
