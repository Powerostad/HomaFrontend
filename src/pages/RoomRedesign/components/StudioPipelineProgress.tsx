import { useSiteTranslation } from '@/i18n/siteCopy';
import type { WorkflowPreview } from '../services/redesignChatService';

export function StudioPipelineProgress({ workflow }: { workflow?: WorkflowPreview | null }) {
  const { siteText: copy } = useSiteTranslation();
  if (!workflow) return null;
  const products = Object.values(workflow.previews?.products_ready || {});
  return <section className="studio-pipeline-progress" aria-label={copy('وضعیت آماده‌شدن نتیجه')}>
    {!!workflow.progress && <ol>{Object.entries(workflow.progress).map(([key, step]) => <li key={key} data-status={step.status}>
      <span>{copy(step.label_fa)}</span><small>{copy(step.status === 'succeeded' ? 'آماده شد' : step.status === 'failed' ? 'نیازمند تلاش دوباره' : 'در حال انجام')}</small>
    </li>)}</ol>}
    {workflow.previews?.analysis_ready?.revised && <p>{copy('تحلیل با بازبینی شواهد به‌روز شد.')}</p>}
    {!!products.length && <div className="studio-pipeline-products">
      <h3>{copy('نتایج اولیهٔ جست‌وجو')}</h3>
      <p>{copy('این گزینه‌ها در حال بررسی‌اند؛ هماهنگی مجموعه، بودجه و شرایط خرید هنوز باید تأیید شوند.')}</p>
      {products.map(item => <article key={item.item_id}>
        <strong>{copy(item.category)}</strong>
        {item.status === 'unavailable' ? <p>{copy('جست‌وجوی این مورد نیازمند تلاش دوباره است.')}</p>
          : !item.products.length ? <p>{copy(item.review_count ? 'گزینه‌هایی برای بررسی مشخصات پیدا شد.' : 'گزینهٔ تأییدشده‌ای پیدا نشده است.')}</p>
          : <ul>{item.products.map(product => <li key={`${product.product_id}:${product.variant_id}`}>
            {product.image_url && <img src={product.image_url} alt="" loading="lazy" />}
            <span dir="auto">{product.name}</span>
          </li>)}</ul>}
      </article>)}
    </div>}
  </section>;
}
