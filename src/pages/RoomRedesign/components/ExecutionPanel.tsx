import { AuthenticatedImage } from '@/components/figma/AuthenticatedImage';
import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial } from '@/utils/formatters';
import { Check, ExternalLink, Image, MapPin, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BackendProduct, ExecutionPlan } from '../services/redesignChatService';
import { MessageText } from './ConversationPanel';

interface Props {
  plan: ExecutionPlan;
  busy: boolean;
  onPreview: (itemId: string, productId: number) => void;
  section?: 'all' | 'plan' | 'products';
}

export function ExecutionPanel({ plan, busy, onPreview, section = 'all' }: Props) {
  const { siteValue } = useSiteTranslation();
  const { t, i18n } = useTranslation();
  const price = (product: BackendProduct) => {
    const rial = product.price_rial ?? (product.price_toman != null ? product.price_toman * 10 : null);
    return rial != null && rial > 0 ? formatPriceFromRial(rial) : t('redesignJourney.unpriced');
  };
  const productCard = (product: BackendProduct, itemId: string) => <div className="studio-catalogue-card" key={product.product_id}>
    <div className="studio-product-media">{product.image_url
      ? <AuthenticatedImage src={product.image_url} alt={siteValue(product.name)} loading="lazy" />
      : <Image size={32} aria-hidden="true" />}</div>
    <div className="studio-product-info">
      <h4>{siteValue(product.name)}</h4>
      {product.merchant_name && <p className="studio-product-merchant">{siteValue(product.merchant_name)}</p>}
      <p className="studio-product-price">{siteValue(price(product))}</p>
      {(product.description || product.ai_description || product.catalog_checked_at) && <details className="studio-product-details">
        <summary>{t('studioChat.details')}</summary>
        <MessageText text={siteValue(product.description || product.ai_description || '')} />
        {product.catalog_checked_at && <p className="studio-caption">{t('redesignJourney.checked')} {new Date(product.catalog_checked_at).toLocaleString(i18n.language)}</p>}
      </details>}
      <div className="studio-product-actions">
        <Button disabled={busy} onClick={() => onPreview(itemId, product.product_id)}>{t('redesignJourney.preview')}</Button>
        {product.merchant_url && /^https?:\/\//i.test(product.merchant_url) && <Button asChild variant="outline"><a href={product.merchant_url} target="_blank" rel="noopener noreferrer">{t(product.merchant_destination === 'shop' ? 'redesignJourney.shop' : 'redesignJourney.merchant')}<ExternalLink size={16} aria-hidden="true" /></a></Button>}
      </div>
    </div>
  </div>;

  return <div className="redesign-execution">
    {section !== 'products' && <div className="studio-plan-sections">
      {Object.entries(plan.studio_documents ?? {}).map(([sceneId, document]) => <section className="studio-plan-summary" key={sceneId}>
        <p className="studio-eyebrow">{t('studioChat.summary')}</p>
        <h3>{siteValue(document.user_facing_summary.main_improvement_idea)}</h3>
        <MessageText text={siteValue(document.user_facing_summary.positive_diagnosis)} />
        {!!document.user_facing_summary.top_changes.length && <div className="studio-plan-changes"><h4>{t('studioChat.changes')}</h4><ul>{document.user_facing_summary.top_changes.map((change, index) => <li key={index}><Check size={16} aria-hidden="true" /><span>{siteValue(change)}</span></li>)}</ul></div>}
        <div className="studio-plan-explained"><div><h4>{t('studioChat.why')}</h4><MessageText text={siteValue(document.user_facing_summary.why_these_changes_work)} /></div><div><h4>{t('studioChat.expected')}</h4><MessageText text={siteValue(document.user_facing_summary.expected_visual_result)} /></div></div>
        <div className="studio-shopping-note"><ShoppingBag size={18} aria-hidden="true" /><p>{siteValue(document.user_facing_summary.shopping_message)}</p></div>
      </section>)}
      {!!plan.free_actions.length && <section><h3>{t('studioChat.actions')}</h3><ul className="studio-action-list">{plan.free_actions.map((action, index) => <li key={index}><strong>{siteValue(action.instruction_fa)}</strong>{action.reason_fa && <p>{siteValue(action.reason_fa)}</p>}</li>)}</ul></section>}
      {!!plan.surface_actions.length && <section><h3>{t('studioChat.surfaces')}</h3><ul className="studio-action-list">{plan.surface_actions.map((action, index) => <li key={index}>{siteValue(action.change_fa)}</li>)}</ul></section>}
    </div>}
    {section !== 'plan' && <>
      <div className="studio-section-intro"><h3>{t('studioChat.products')}</h3><p>{t('studioChat.productHint')}</p></div>
      {!plan.purchases.length && <p className="studio-empty-note">{t('studioChat.noProducts')}</p>}
      <div className="studio-purchase-list">{plan.purchases.map(item => {
        const placement = item.mother_product?.placement_instruction || item.placement_instruction_fa;
        return <article className="studio-purchase" key={item.item_id}>
          <div className="studio-purchase-heading"><h3>{siteValue(item.mother_product?.product_name_generic || item.category)}</h3><span className="studio-quantity">{t('studioChat.quantity')}: {item.quantity.toLocaleString(i18n.language)}</span></div>
          {item.product ? productCard(item.product, item.item_id) : <div className="studio-concept"><ShoppingBag size={20} aria-hidden="true" /><div><p>{t('studioChat.conceptHint')}</p><strong>{t('redesignJourney.unpriced')}</strong></div></div>}
          <dl className="studio-purchase-rationale"><div><dt>{t('studioChat.reason')}</dt><dd>{siteValue(item.reason_fa || item.mother_product?.why_needed)}</dd></div>{placement && <div className="studio-placement"><dt><MapPin size={16} aria-hidden="true" />{t('studioChat.placement')}</dt><dd>{siteValue(placement)}</dd></div>}</dl>
          <p className="studio-relation">{t(`redesignJourney.${item.relation}`, { defaultValue: t('redesignJourney.similar') })}</p>
          {!!item.alternatives.length && <details className="studio-alternatives"><summary>{t('redesignJourney.alternatives')} · {item.alternatives.length.toLocaleString(i18n.language)}</summary><div className="studio-alternative-list">{item.alternatives.map(product => productCard(product, item.item_id))}</div></details>}
        </article>;
      })}</div>
      <section className="studio-cost-summary"><div><p className="studio-eyebrow">{t('studioChat.cost')}</p><h3>{siteValue(plan.known_subtotal_rial > 0 ? formatPriceFromRial(plan.known_subtotal_rial) : plan.unknown_cost_item_ids.length ? t('studioChat.priceUnknown') : `${(0).toLocaleString(i18n.language)} ${t('redesignJourney.toman')}`)}</h3><p>{t('studioChat.costHint')}</p></div>
        {plan.budget_ceiling_toman != null && <p>{t('redesignJourney.ceiling')} <strong>{siteValue(plan.budget_ceiling_toman === 0 ? t('redesignJourney.noPurchases') : formatPriceFromRial(plan.budget_ceiling_toman * 10))}</strong></p>}
        {!!plan.unknown_cost_item_ids.length && <p>{t('studioChat.unknownCosts', { count: plan.unknown_cost_item_ids.length })}</p>}
        <p>{t(`redesignJourney.budget_${plan.budget_status}`)}</p><p className="studio-caption">{t('redesignJourney.excluded')}</p>
      </section>
    </>}
  </div>;
}
