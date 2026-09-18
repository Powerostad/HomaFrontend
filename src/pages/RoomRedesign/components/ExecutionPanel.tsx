import { useTranslation } from 'react-i18next';
import { formatPriceFromRial } from '@/utils/formatters';
import type { BackendProduct, ExecutionPlan } from '../services/redesignChatService';

export function ExecutionPanel({ plan, busy, onPreview }: { plan: ExecutionPlan; busy: boolean; onPreview: (itemId: string, productId: number) => void }) {
  const { t, i18n } = useTranslation();
  const product = (p: BackendProduct, itemId: string) => <details key={p.product_id} className="redesign-product">
    <summary>{p.name} · {p.price_rial != null && p.price_rial > 0 ? formatPriceFromRial(p.price_rial) : t('redesignJourney.unpriced')}</summary>
    {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" />}
    <p>{p.description || p.ai_description}</p>
    <p>{p.merchant_name}</p>
    {p.catalog_checked_at && <p>{t('redesignJourney.checked')} {new Date(p.catalog_checked_at).toLocaleString(i18n.language)}</p>}
    <button disabled={busy} onClick={() => onPreview(itemId, p.product_id)}>{t('redesignJourney.preview')}</button>
    {p.merchant_url && /^https?:\/\//i.test(p.merchant_url) && <a href={p.merchant_url} target="_blank" rel="noopener noreferrer">{t(p.merchant_destination === 'shop' ? 'redesignJourney.shop' : 'redesignJourney.merchant')}</a>}
  </details>;
  return <div className="redesign-execution">
    {plan.free_actions.length > 0 && <ul>{plan.free_actions.map((a, i) => <li key={i}>{a.instruction_fa}{a.reason_fa && <p>{a.reason_fa}</p>}</li>)}</ul>}
    {plan.surface_actions.map((a, i) => <p key={i}>{a.change_fa}</p>)}
    <p>{t('redesignJourney.subtotal')} {plan.known_subtotal_rial === 0 ? `${(0).toLocaleString(i18n.language)} ${t('redesignJourney.toman')}` : formatPriceFromRial(plan.known_subtotal_rial)}</p>
    {plan.budget_ceiling_toman != null && <p>{t('redesignJourney.ceiling')} {plan.budget_ceiling_toman === 0 ? t('redesignJourney.noPurchases') : formatPriceFromRial(plan.budget_ceiling_toman * 10)}</p>}
    <p>{t(`redesignJourney.budget_${plan.budget_status}`)}</p>
    <p>{t('redesignJourney.excluded')}</p>
    {plan.purchases.map(item => <article key={item.item_id}>
      <h3>{item.category} × {item.quantity}</h3><p>{item.reason_fa}</p><p>{t(`redesignJourney.${item.relation}`)}</p>
      {item.product && product(item.product, item.item_id)}
      {!!item.alternatives.length && <details><summary>{t('redesignJourney.alternatives')}</summary>{item.alternatives.map(p => product(p, item.item_id))}</details>}
    </article>)}
  </div>;
}
