import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toLocalizedDigits } from '@/utils/formatters';

import { cabinRug as rug } from './cabinSample';

export function HomeStudioShopping() {
  const { t, i18n } = useTranslation();
  const text = (key: string) => t(`landing.studioExample.shopping.${key}`);
  return (
    <div className="hs-studio-shopping">
      <div className="hs-studio-product">
        <img src={rug.image} alt="" width={60} height={76} loading="lazy" />
        <div>
          <small>{text('similar')}</small>
          <h3><bdi dir="ltr">{rug.name}</bdi></h3>
          <p>{t('landing.studioExample.shopping.spec', { size: toLocalizedDigits(rug.sizeCm, i18n.language) })}</p>
        </div>
      </div>
      <a className="hs-studio-seller" href={rug.link}>
        {t('landing.studioExample.shopping.seller', { name: rug.seller })}
        <ExternalLink size={15} aria-hidden="true" />
      </a>
      <dl className="hs-studio-cost-lines">
        <div><dt>{text('curtainLine')}</dt><dd>{text('curtainQuote')}</dd></div>
      </dl>
    </div>
  );
}
