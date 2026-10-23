import { useState } from 'react';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { StudioDiscovery } from '@/pages/RoomRedesign/components/StudioDiscovery';
import type { AnalysisPreview } from '@/pages/RoomRedesign/services/discoveryReview';
import type { ExecutionPlan } from '@/pages/RoomRedesign/services/redesignChatService';

// Local UI fixtures only: no session creation, model request, or automatic execution.
const analysis: AnalysisPreview = { studio_documents: { room: {
  room_analysis: { layout_evaluation: { layout_issues: [
    { issue_id: 'path', evidence: 'میز جلو مبلی به مسیر ورود نزدیک است و رفت‌وآمد کنار نشیمن را محدود می‌کند.' },
    { issue_id: 'rug', evidence: 'فرش از محدودهٔ پایه‌های جلوی مبل کوچک‌تر است و اجزای نشیمن از هم جدا دیده می‌شوند.' },
  ] } },
  user_facing_summary: { positive_diagnosis: 'نور طبیعی و رنگ‌های روشن، نقطهٔ شروع خوبی برای این نشیمن هستند.', main_improvement_idea: 'با اصلاح فاصلهٔ مبلمان و هماهنگی بافت‌ها، فضا منسجم‌تر و کاربردی‌تر می‌شود.' },
  layout_fix_plan: [{ resolves_issue_id: 'path', specific_instruction: 'میز را کمی به مرکز نشیمن منتقل کن تا مسیر ورودی بازتر شود.' }, { resolves_issue_id: 'rug', specific_instruction: 'در طراحی، پایه‌های جلوی مبل داخل محدودهٔ فرش قرار می‌گیرند.' }],
} } };
const plan: ExecutionPlan = { purchases: [], free_actions: [], surface_actions: [], known_subtotal_rial: 0, unknown_cost_item_ids: [], budget_ceiling_toman: null, budget_status: 'sample', studio_documents: analysis.studio_documents as ExecutionPlan['studio_documents'] };
type Phase = 'loading' | 'review' | 'ready' | 'error';
export default function DiscoveryPreview() {
  const { siteText: copy } = useSiteTranslation();
  const [phase, setPhase] = useState<Phase>(() => {
    const requested = new URLSearchParams(window.location.search).get('state');
    return requested === 'review' || requested === 'ready' || requested === 'error' ? requested : 'loading';
  });
  return <StudioDiscovery key={phase} plan={phase === 'loading' ? null : plan} analysisPreview={phase === 'loading' ? null : analysis}
    originalImage="/images/studio/preset-modern-living.webp" sessionId={null} busy={phase === 'loading' || phase === 'review'}
    error={phase === 'error' ? copy('خطای نمونه؛ هیچ مدل یا سرویس تولید تصویری اجرا نشده است.') : null} resultAvailable={phase === 'ready'}
    stage={copy(phase === 'loading' ? 'پیش‌نمایش: در حال شناخت فضا' : 'پیش‌نمایش: در حال آماده‌سازی خروجی')}
    onRetry={() => setPhase('review')} onComplete={() => setPhase('ready')} onNew={() => setPhase('loading')} onDiscuss={() => {}}
    tools={<div className="grid gap-3"><p>{copy('پیش‌نمایش رابط؛ بدون اجرای مدل و بدون هزینهٔ تحلیل یا تصویر')}</p>{([
      ['loading', 'لودینگ اولیه'], ['review', 'تحلیل فضا'], ['ready', 'خروجی آماده'], ['error', 'نمایش خطا'],
    ] as const).map(([id, label]) => <button className="min-h-11 border p-3" key={id} type="button" onClick={() => setPhase(id)}>{copy(label)}</button>)}</div>} />;
}
