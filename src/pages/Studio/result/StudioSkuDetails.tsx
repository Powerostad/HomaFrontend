import { useTranslation } from 'react-i18next';
import type { Product } from '../components/ProductDetailSheet';

export function StudioSkuDetails({ product }: { product: Product }) {
  const { t, i18n } = useTranslation();
  if (!product.purchaseStatus && product.variantId == null) return null;
  return <div className="studio-sku-details">
    {product.variantLabel && <p>{product.variantLabel}</p>}
    {!!Object.keys(product.dimensionsCm || {}).length && <p>{Object.entries(product.dimensionsCm || {}).map(([key, value]) =>
      `${t(`studioV2.attribute.${key}`, { defaultValue: t('studioV2.specification') })}: ${value.toLocaleString(i18n.language)}`).join(' · ')} {t('studioV2.cm')}</p>}
    {product.orderQuote?.status === 'quoted' && <p>{t('studioOrder.summary', {
      orderCount: product.orderQuote.order_quantity?.toLocaleString(i18n.language),
      unit: t(`studioOrder.unit.${product.orderQuote.sales_unit}`),
      demand: Number(product.orderQuote.demand_quantity).toLocaleString(i18n.language),
      demandUnit: t(`studioOrder.unit.${product.orderQuote.demand_unit}`),
    })}</p>}
    {product.purchaseStatus && <p>{t(`studioV2.purchase.${product.purchaseStatus}`)}</p>}
  </div>;
}
