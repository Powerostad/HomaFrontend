import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { AddToBasketButton } from '@/components/basket/AddToBasketButton';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial } from '@/utils/formatters';
import { Image, ScanLine, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ProductDetailSheet, type Product } from '../../Studio/components/ProductDetailSheet';
import type { BackendProduct, ExecutionPlan } from '../services/redesignChatService';
import { MessageText } from './ConversationPanel';
import { ExecutionPanel } from './ExecutionPanel';

function CatalogueProduct({ product, busy, onPreview, onDetails }: { product: BackendProduct; busy: boolean; onPreview: () => void; onDetails: () => void }) {
  const { t } = useTranslation();
  const { siteValue } = useSiteTranslation();
  const price = product.price_rial ?? (product.price_toman != null ? product.price_toman * 10 : null);
  return <article className="studio-product-preview studio-flow-product">
    <button type="button" className="studio-product-image-button" onClick={onDetails} aria-label={siteValue(product.name)}>
      {product.image_url ? <AuthenticatedImage className="studio-product-image" src={product.image_url} alt={siteValue(product.name)} loading="lazy" />
        : <div className="studio-flow-missing"><Image size={28} aria-hidden="true" /><span>{t('studioCollection.noPhoto')}</span></div>}
    </button>
    <div className="studio-product-copy">
      <button type="button" className="studio-product-name" onClick={onDetails}>{siteValue(product.name)}</button>
      {product.merchant_name && <p className="studio-product-reason">{siteValue(product.merchant_name)}</p>}
      <span className="studio-price">{price != null && price > 0 ? siteValue(formatPriceFromRial(price)) : t('redesignJourney.unpriced')}</span>
      <Button disabled={busy} onClick={onPreview}><ScanLine size={16} aria-hidden="true" />{t('redesignJourney.preview')}</Button>
      {product.unique_link && <AddToBasketButton productUniqueLink={product.unique_link} sourceContext="studio" variant="outline" />}
      {product.merchant_url && /^https?:\/\//i.test(product.merchant_url) && <Button asChild variant="outline"><a href={product.merchant_url} target="_blank" rel="noopener noreferrer">{t(product.merchant_destination === 'shop' ? 'redesignJourney.shop' : 'redesignJourney.merchant')}</a></Button>}
      {(product.description || product.ai_description) && <details className="studio-flow-details"><summary>{t('studioChat.details')}</summary><MessageText text={siteValue(product.description || product.ai_description || '')} /></details>}
    </div>
  </article>;
}

/** The original result flow, fed by the validated conversation report. */
export function StudioFlowReport({ plan, busy, onPreview, onOpenBasket }: {
  plan: ExecutionPlan; busy: boolean; onPreview: (itemId: string, productId: number) => void; onOpenBasket: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { siteValue } = useSiteTranslation();
  const [opened, setOpened] = useState<{ itemId: string; productId: number } | null>(null);
  const item = plan.purchases.find(entry => entry.item_id === opened?.itemId);
  const catalogue = item ? [item.product, ...item.alternatives].filter((product): product is BackendProduct => !!product) : [];
  const selected = catalogue.find(product => product.product_id === opened?.productId);
  const toSheet = (product: BackendProduct): Product => {
    const price = product.price_rial ?? (product.price_toman != null ? product.price_toman * 10 : null);
    return { id: String(product.product_id), name: product.name, price: price ?? 0, priceUnknown: price == null || price <= 0,
      image: product.image_url || '', category: product.category_fa || item?.category || '', store: product.merchant_name,
      description: product.description || product.ai_description, persianReason: item?.reason_fa, matchHighlights: product.match_notes,
      link: product.merchant_url && /^https?:\/\//i.test(product.merchant_url) ? product.merchant_url : undefined, uniqueLink: product.unique_link };
  };
  return <>
    <section id="section-analysis" className="studio-result-section" aria-label={t('studioChat.plan')}>
      <ExecutionPanel plan={plan} busy={busy} onPreview={onPreview} section="plan" />
    </section>
    <section id="section-products" className="studio-result-section" aria-labelledby="studio-flow-products-title">
      <div className="studio-section-heading"><div><p className="studio-result-eyebrow">{t('studio.result.v2.phase.recommendations')}</p><h2 id="studio-flow-products-title">{t('studioChat.products')}</h2></div><span className="studio-count-badge">{plan.purchases.length.toLocaleString(i18n.language)}</span></div>
      <div className="studio-flow-recommendations">{plan.purchases.map((item, index) => <article className="studio-recommendation-card" key={item.item_id}>
        <header className="studio-recommendation-header"><div className="studio-recommendation-step">{(index + 1).toLocaleString(i18n.language, { minimumIntegerDigits: 2 })}</div><div className="studio-recommendation-title"><span>{t('studio.result.v2.card.changeLabel')}</span><h3>{siteValue(item.mother_product?.product_name_generic || item.category)}</h3></div></header>
        <div className="studio-recommendation-copy"><MessageText text={siteValue(item.reason_fa || item.mother_product?.why_needed || '')} />{(item.mother_product?.placement_instruction || item.placement_instruction_fa) && <p><strong>{t('studioChat.placement')}: </strong>{siteValue(item.mother_product?.placement_instruction || item.placement_instruction_fa || '')}</p>}<p>{t('studioChat.quantity')}: {item.quantity.toLocaleString(i18n.language)}</p></div>
        <p className="studio-product-reason">{t(`redesignJourney.${item.relation}`, { defaultValue: t('redesignJourney.similar') })}</p>
        {item.product ? <CatalogueProduct product={item.product} busy={busy} onDetails={() => setOpened({ itemId: item.item_id, productId: item.product!.product_id })} onPreview={() => onPreview(item.item_id, item.product!.product_id)} />
          : <div className="studio-action-item"><p>{t('studioChat.conceptHint')}</p><span>{t('redesignJourney.unpriced')}</span></div>}
        {!!item.alternatives.length && <details className="studio-flow-details"><summary>{t('redesignJourney.alternatives')} · {item.alternatives.length.toLocaleString(i18n.language)}</summary><div className="studio-alternatives-grid">{item.alternatives.map(product => <CatalogueProduct key={product.product_id} product={product} busy={busy} onDetails={() => setOpened({ itemId: item.item_id, productId: product.product_id })} onPreview={() => onPreview(item.item_id, product.product_id)} />)}</div></details>}
      </article>)}</div>
      {!plan.purchases.length && <p className="studio-empty-state">{t('studioChat.noProducts')}</p>}
    </section>
    <section id="section-basket" className="studio-result-section studio-invoice" aria-label={t('studioChat.cost')}>
      <div className="studio-invoice-heading"><div><p className="studio-result-eyebrow">{t('studioChat.cost')}</p><h2>{plan.known_subtotal_rial > 0 ? siteValue(formatPriceFromRial(plan.known_subtotal_rial)) : plan.unknown_cost_item_ids.length ? t('studioChat.priceUnknown') : `${(0).toLocaleString(i18n.language)} ${t('redesignJourney.toman')}`}</h2></div><ShoppingBag aria-hidden="true" /></div>
      <p>{t('studioChat.costHint')}</p>
      {!!plan.unknown_cost_item_ids.length && <p>{t('studioChat.unknownCosts', { count: plan.unknown_cost_item_ids.length })}</p>}
      {plan.budget_ceiling_toman != null && <p>{t('redesignJourney.ceiling')} {plan.budget_ceiling_toman === 0 ? t('redesignJourney.noPurchases') : siteValue(formatPriceFromRial(plan.budget_ceiling_toman * 10))}</p>}
      <p>{t(`redesignJourney.budget_${plan.budget_status}`)}</p><p className="studio-caption">{t('redesignJourney.excluded')}</p>
      <Button onClick={onOpenBasket}>{t('studio.result.v2.summary.viewBasket')}</Button>
    </section>
    {selected && item && <ProductDetailSheet product={toSheet(selected)} isOpen onClose={() => setOpened(null)} onReplace={() => {}}
      alternatives={catalogue.filter(product => product.product_id !== selected.product_id).map(toSheet)}
      onSelectProduct={product => setOpened({ itemId: item.item_id, productId: Number(product.id) })}
      onPreview={() => { setOpened(null); onPreview(item.item_id, selected.product_id); }} previewBusy={busy} />}
  </>;
}
