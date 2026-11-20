import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toLocalizedDigits } from '@/utils/formatters';

// Dated public seller listing for the example. The seller sets the checkout price.
const rug = {
  name: 'IKEA LOHALS',
  seller: 'Zardaan',
  priceToman: 73_820_000,
  checkedOn: '2026-11-16',
  sizeCm: '160 × 230',
  link: 'https://zardaan.com/product/فرش-کنفی-ایکیه-lohals-سایز-230160/',
  image: 'https://zardaan.com/wp-content/uploads/2022/10/lohals-rug-flatwoven-natural__0280221_pe419173_s5_11zon-150x150.webp',
};

export function HomeStudioShopping() {
  const { t, i18n } = useTranslation();
  const [showPhoto, setShowPhoto] = useState(true);
  const text = (key: string) => t(`landing.studioExample.shopping.${key}`);
  const price = t('landing.studioExample.shopping.price', {
    value: new Intl.NumberFormat(i18n.language).format(rug.priceToman),
  });
  const checkedDate = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(rug.checkedOn));
  return (
    <div className="hs-studio-shopping">
      <div className="hs-studio-product">
        {showPhoto && <img src={rug.image} alt={rug.name} width={76} height={76}
          referrerPolicy="no-referrer" onError={() => setShowPhoto(false)} />}
        <div>
          <small>{text('similar')}</small>
          <h3><bdi dir="ltr">{rug.name}</bdi></h3>
          <p>{t('landing.studioExample.shopping.spec', { size: toLocalizedDigits(rug.sizeCm, i18n.language) })}</p>
        </div>
      </div>
      <dl className="hs-studio-cost-lines">
        <div><dt>{text('rugLine')}</dt><dd>{price}</dd></div>
        <div><dt>{text('curtainLine')}</dt><dd>{text('curtainQuote')}</dd></div>
        <div><dt>{text('subtotal')}</dt><dd>{price}</dd></div>
      </dl>
      <p className="hs-studio-quote-note">
        {t('landing.studioExample.shopping.checked', { date: checkedDate })} {text('exclusions')}
      </p>
      <a className="hs-studio-seller" href={rug.link}>
        {t('landing.studioExample.shopping.seller', { name: rug.seller })}
        <ExternalLink size={15} aria-hidden="true" />
      </a>
    </div>
  );
}
