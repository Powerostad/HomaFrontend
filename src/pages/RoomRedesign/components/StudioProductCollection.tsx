import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { MapPin, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExecutionPlan } from '../services/redesignChatService';
import { StudioProductCard } from './StudioProductCard';

export function StudioProductCollection({ items, busy, onPreview }: {
  items: ExecutionPlan['purchases']; busy: boolean; onPreview: (itemId: string, productId: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const { siteValue } = useSiteTranslation();
  const [category, setCategory] = useState<string | null>(null);
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  // A changed version may no longer contain the previous filter.
  const activeCategory = category && categories.includes(category) ? category : null;
  const visible = activeCategory ? items.filter(item => item.category === activeCategory) : items;
  return <>
    <div className="studio-section-intro"><div><p className="studio-eyebrow">{t('studioCollection.eyebrow')}</p><h3>{t('studioChat.products')}</h3><p>{t('studioChat.productHint')}</p></div><span className="studio-collection-count">{items.length.toLocaleString(i18n.language)}</span></div>
    {categories.length > 1 && <div className="studio-product-filters" role="group" aria-label={t('studioCollection.filter')}>
      <Button variant="ghost" aria-pressed={!activeCategory} onClick={() => setCategory(null)}>{t('studioCollection.all')}</Button>
      {categories.map(value => <Button key={value} variant="ghost" aria-pressed={activeCategory === value} onClick={() => setCategory(value)}>{siteValue(value)}</Button>)}
    </div>}
    {!items.length && <div className="studio-products-empty"><ShoppingBag size={32} aria-hidden="true" /><p>{t('studioChat.noProducts')}</p></div>}
    <div className="studio-purchase-list">{visible.map(item => {
      const placement = item.mother_product?.placement_instruction || item.placement_instruction_fa;
      return <article className="studio-purchase" key={item.item_id}>
        <div className="studio-purchase-heading"><h3>{siteValue(item.mother_product?.product_name_generic || item.category)}</h3><span className="studio-quantity">{t('studioChat.quantity')}: {item.quantity.toLocaleString(i18n.language)}</span></div>
        {item.product ? <StudioProductCard product={item.product} busy={busy} onPreview={() => onPreview(item.item_id, item.product!.product_id)} />
          : <div className="studio-concept"><ShoppingBag size={28} aria-hidden="true" /><p>{t('studioChat.conceptHint')}</p><strong>{t('redesignJourney.unpriced')}</strong></div>}
        <div className="studio-purchase-footer">
          <p className="studio-relation">{t(`redesignJourney.${item.relation}`, { defaultValue: t('redesignJourney.similar') })}</p>
          <details className="studio-product-details">
            <summary>{t('studioCollection.whyAndWhere')}</summary>
            <dl className="studio-purchase-rationale"><div><dt>{t('studioChat.reason')}</dt><dd>{siteValue(item.reason_fa || item.mother_product?.why_needed)}</dd></div>{placement && <div className="studio-placement"><dt><MapPin size={16} aria-hidden="true" />{t('studioChat.placement')}</dt><dd>{siteValue(placement)}</dd></div>}</dl>
          </details>
          {!!item.alternatives.length && <details className="studio-alternatives"><summary>{t('redesignJourney.alternatives')} · {item.alternatives.length.toLocaleString(i18n.language)}</summary><div className="studio-alternative-list">{item.alternatives.map(product => <StudioProductCard key={product.product_id} product={product} busy={busy} onPreview={() => onPreview(item.item_id, product.product_id)} />)}</div></details>}
        </div>
      </article>;
    })}</div>
  </>;
}
