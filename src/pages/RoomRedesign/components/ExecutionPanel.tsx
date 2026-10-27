import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial } from '@/utils/formatters';
import { Check, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ExecutionPlan } from '../services/redesignChatService';
import { MessageText } from './ConversationPanel';
import { StudioProductCollection } from './StudioProductCollection';

interface Props {
  plan: ExecutionPlan;
  busy: boolean;
  onPreview: (itemId: string, productId: number, variantId?: number | null, placementId?: string | null) => void;
  section?: 'all' | 'plan' | 'products';
}

export function ExecutionPanel({ plan, busy, onPreview, section = 'all' }: Props) {
  const { siteValue } = useSiteTranslation();
  const { t, i18n } = useTranslation();

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
      <StudioProductCollection key={plan.purchases.map(item => item.item_id).join('|')} items={plan.purchases} busy={busy} onPreview={onPreview} />
      <section className="studio-cost-summary"><div><p className="studio-eyebrow">{t('studioChat.cost')}</p><h3>{siteValue(plan.known_subtotal_rial > 0 ? formatPriceFromRial(plan.known_subtotal_rial) : plan.unknown_cost_item_ids.length ? t('studioChat.priceUnknown') : `${(0).toLocaleString(i18n.language)} ${t('redesignJourney.toman')}`)}</h3><p>{t('studioChat.costHint')}</p></div>
        {plan.budget_ceiling_toman != null && <p>{t('redesignJourney.ceiling')} <strong>{siteValue(plan.budget_ceiling_toman === 0 ? t('redesignJourney.noPurchases') : formatPriceFromRial(plan.budget_ceiling_toman * 10))}</strong></p>}
        {!!plan.unknown_cost_item_ids.length && <p>{t('studioChat.unknownCosts', { count: plan.unknown_cost_item_ids.length })}</p>}
        <p>{t(`redesignJourney.budget_${plan.budget_status}`)}</p><p className="studio-caption">{t('redesignJourney.excluded')}</p>
      </section>
    </>}
  </div>;
}
