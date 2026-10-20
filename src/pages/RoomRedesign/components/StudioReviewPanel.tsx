import { Button } from '@/components/ui/button';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { useTranslation } from 'react-i18next';
import { formatPriceFromRial } from '@/utils/formatters';
import type { SendTurnArgs } from '../hooks/useRedesignChat';
import type { BackendProduct, ExecutionPlan, ReviewKind } from '../services/redesignChatService';
import { StudioRuleFindings } from './StudioRuleFindings';

/** Unresolved catalogue evidence is visible alongside the design, never a SKU approval. */
export function StudioReviewPanel({ plan, busy, onAction }: {
  plan: ExecutionPlan; busy: boolean; onAction: (args: SendTurnArgs) => void;
}) {
  const { t } = useTranslation();
  const { siteValue, siteText: copy } = useSiteTranslation();
  if (plan.evaluation?.model_reviews_enabled === false) return null;
  const concept = plan.visualization?.purchase_independent === true;
  const review = (item: ExecutionPlan['purchases'][number], product: BackendProduct, kind: ReviewKind) =>
    onAction({ text: '', action: 'review_product', itemId: item.source_item_id || item.item_id,
      placementId: item.placement_id, productId: product.product_id, variantId: product.candidate?.variant_id, reviewKind: kind });
  return <section className="studio-plan-summary studio-v2-review" aria-label={t('studioV2.reviewTitle')}>
    <h3>{t('studioV2.reviewTitle')}</h3>
    <StudioRuleFindings findings={plan.rule_findings} />
    {plan.image_review && <div role="status">
      <h4>{copy('بازبینی تصویر')}</h4>
      <p>{copy(plan.image_review.status === 'accepted' ? 'بررسی بصری انجام شد؛ اندازهٔ واقعی و تطابق دقیق واریانت تأیید نشده است.'
        : plan.image_review.status === 'conflict' ? 'در اجرای تصویر مغایرت دیده شد؛ نکته‌های بازبینی را بررسی کن.' : 'بخشی از اجرای تصویر هنوز نیاز به بررسی دارد.')}</p>
      {plan.image_review.checks.filter(check => check.status !== 'pass').map(check => <p key={check.aspect}>{siteValue(check.explanation_fa)}</p>)}
    </div>}
    {plan.evaluation?.visual_review && <details><summary>{copy('بازبینی بصری محصولات')}</summary>
      <p>{copy('این بررسی بر اساس عکس خانوادهٔ محصول است و مشخصات واقعی واریانت را تأیید نمی‌کند.')}</p>
      {plan.evaluation.visual_review.status === 'unavailable' && <p>{copy('بازبینی بصری در دسترس نبود؛ انتخاب‌ها تأیید نهایی نشده‌اند.')}</p>}
      {plan.evaluation.visual_review.assessments?.map(row => <p key={row.reference_id}>{siteValue(row.explanation_fa)}</p>)}
    </details>}
    <p role="status">{concept
      ? copy(plan.evaluation?.purchase_ready ? 'محصولات برای بررسی نهایی خرید آماده‌اند.' : 'ایدهٔ طراحی مستقل است؛ انتخاب‌های خرید هنوز نیازمند تکمیل یا تأیید هستند.')
      : t(`studioV2.status.${plan.evaluation?.status || 'needs_information'}`)}</p>
    <p>{t('studioPrint.knownSubtotal')}: {formatPriceFromRial(plan.known_subtotal_rial)}</p>
    <p>{t('studioV2.costGaps', { count: plan.cost_gaps?.length || 0 })}</p>
    <p>{t('studioV2.verificationGaps', { count: plan.verification_gaps?.length || 0 })}</p>
    <p className="studio-caption">{t('studioV2.imageScope')}</p>
    {plan.evaluation?.coherence?.summary_fa && <p>{siteValue(plan.evaluation.coherence.summary_fa)}</p>}
    {plan.evaluation?.coherence?.assessments.filter(a => a.status !== 'compatible').map((a, index) => <p key={index}>{siteValue(a.explanation_fa)}</p>)}
    {plan.purchases.map(item => {
      const candidates = item.review_candidates || [];
      const task = plan.review_tasks?.find(value => value.id === item.item_id);
      return <div key={item.item_id} className="studio-v2-review-item">
        <h4>{siteValue(item.mother_product?.product_name_generic || item.category)}</h4>
        {item.placement_instruction_fa && <p>{siteValue(item.placement_instruction_fa)}</p>}
        {item.selection_status === 'requires_review' && <p role="alert">{t('studioV2.invalidSelection')}</p>}
        {task && <p>{t(`studioV2.route.${task.route}`, { defaultValue: t('studioV2.needsReview') })}</p>}
        {!!task?.missing_attributes.length && <p>{t('studioV2.requiredSpecs')}: {task.missing_attributes.map(attribute => t(`studioV2.attribute.${attribute}`, { defaultValue: t('studioV2.specification') })).join('، ')}</p>}
        {item.product && <div className="studio-product-actions">{(['wrong_size', 'wrong_style', 'request_alternative'] as const).map(kind =>
          <Button key={kind} variant="outline" disabled={busy} onClick={() => review(item, item.product!, kind)}>{t(`studioV2.feedback.${kind}`)}</Button>)}</div>}
        {!!candidates.length && <details><summary>{copy('گزینه‌های محصول نیازمند بررسی')} ({candidates.length})</summary>
        {candidates.map(product => <article key={`${product.product_id}/${product.candidate?.variant_id ?? 'parent'}`}>
          <strong>{siteValue(product.name)}</strong>
          {product.candidate?.variant_label && <p>{siteValue(product.candidate.variant_label)}</p>}
          <p>{t('studioV2.reviewOnly')}</p>
          <div className="studio-product-actions">
            {product.merchant_url && /^https?:\/\//i.test(product.merchant_url) && <Button asChild variant="outline"><a href={product.merchant_url} target="_blank" rel="noopener noreferrer">{t('studioV2.source')}</a></Button>}
            <Button variant="outline" disabled={busy} onClick={() => review(item, product, 'verify_specification')}>{t('studioV2.requestReview')}</Button>
          </div>
        </article>)}</details>}
        {(!item.product || candidates.length > 0 || item.retrieval_report?.status === 'unavailable') && <Button variant="outline" disabled={busy}
          onClick={() => onAction({ text: '', action: 'retry_search', itemId: item.source_item_id || item.item_id, placementId: item.placement_id })}>{t('studioV2.retrySearch')}</Button>}
      </div>;
    })}
    {!!plan.evaluation?.blocked_actions.length && <p>{concept
      ? copy('پیش‌نیازهای خرید یا اجرای واقعی هنوز کامل نیست؛ این وضعیت مانع نمایش ایدهٔ طراحی نمی‌شود.')
      : t('studioV2.blockedActions', { count: plan.evaluation.blocked_actions.length })}</p>}
  </section>;
}
