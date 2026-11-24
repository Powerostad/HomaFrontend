import { useTranslation } from 'react-i18next';
import './home-studio-path.css';

export function HomeStudioCost() {
  const { t } = useTranslation();
  const text = (key: string) => t(`landing.studioPath.${key}`);
  return (
    <section id="studio-cost" className="hs-cost" aria-labelledby="hs-cost-title">
      <h2 id="hs-cost-title">{text('costTitle')}</h2>
      <dl>
        {['draft', 'design', 'purchase'].map(key => (
          <div key={key}>
            <dt>{text(`cost.${key}.title`)}</dt>
            <dd>{text(`cost.${key}.body`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
