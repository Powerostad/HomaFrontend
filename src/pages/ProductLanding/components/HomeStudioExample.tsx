import { ExternalLink, ShoppingBag } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { designShopProducts, featuredDesignShopProducts } from './designShopSample';
import './home-studio-example.css';

export function HomeStudioExample(_props: { onStudioStart?: () => void }) {
  const { siteText: t, siteDirection, siteLocale } = useSiteTranslation();
  const cards = useRef(new Map<number | string, HTMLAnchorElement>());
  const number = new Intl.NumberFormat(siteLocale());

  function productCard(product: (typeof designShopProducts)[number], floating = false) {
    return (
      <a key={product.id} className="ds-product" data-product={product.id}
        ref={node => { if (floating && node) cards.current.set(product.id, node); }}
        href={product.url} target="_blank" rel="noopener noreferrer"
        aria-label={t('{{name}}، مشاهده در {{seller}}', { name: t(product.name), seller: t(product.seller) })}>
        <img className="ds-product-photo" src={product.image} alt="" width={180} height={118} loading="lazy" decoding="async" />
        <h3>{t(product.name)}</h3>
        <p className="ds-product-price">
          {product.priceToman === null
            ? t('استعلام قیمت از فروشنده')
            : t('priceFrom' in product && product.priceFrom ? 'از {{price}} تومان' : '{{price}} تومان', {
              price: number.format(product.priceToman),
            })}
        </p>
        <div className="ds-product-seller">
          {product.logo && <img src={product.logo} alt="" width={26} height={20} loading="lazy" />}
          <span>{t(product.seller)}</span>
          <ExternalLink size={14} strokeWidth={1.5} aria-hidden />
        </div>
      </a>
    );
  }

  return (
    <section id="how-it-works" className="hs-studio ds-section" dir={siteDirection()} aria-labelledby="hs-studio-title">
      <header className="ds-heading">
        <h2 id="hs-studio-title">{t('وسایل طرحت رو بخر')}</h2>
        <p>{t('هما وسایل متناسب با طرحت رو پیشنهاد می‌ده و نشون می‌ده از کدوم فروشنده‌های ایرانی می‌تونی بخری.')}</p>
      </header>

      <div className="ds-composition">
        <div className="ds-project">
          <img className="ds-project-image" src="/images/design-to-shop/sepidar-cabin.webp"
            alt={t('اتاق کلبهٔ سپیدار با روتختی روشن، آینهٔ چوبی و فرش کرم')}
            width={1448} height={1086} loading="lazy" decoding="async" />
          {featuredDesignShopProducts.map(product => (
            <button key={product.id} type="button" className="ds-hotspot"
              style={{ left: product.x + '%', top: product.y + '%' }}
              aria-label={t('دیدن پیشنهاد {{name}}', { name: t(product.name) })}
              onClick={() => cards.current.get(product.id)?.focus({ preventScroll: false })}>
              <span />
            </button>
          ))}
        </div>
        <div className="ds-floating-products" aria-label={t('محصولات پیشنهادی برای این فضا')}>
          {featuredDesignShopProducts.map(product => productCard(product, true))}
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="ds-shop-button" type="button"><ShoppingBag size={20} strokeWidth={1.35} aria-hidden />
            {t('دیدن پیشنهادهای خرید')}
          </Button>
        </DialogTrigger>
        <DialogContent dir={siteDirection()} className="ds-shopping-dialog">
          <DialogTitle>{t('محصولات پیشنهادی برای این فضا')}</DialogTitle>
          <DialogDescription>{t('ست کاوری از طرح سپیدار و چند گزینهٔ مشابه برای تکمیل اتاق. قیمت روز و خرید در سایت فروشنده.')}</DialogDescription>
          <div className="ds-shopping-products">{designShopProducts.map(product => productCard(product))}</div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
