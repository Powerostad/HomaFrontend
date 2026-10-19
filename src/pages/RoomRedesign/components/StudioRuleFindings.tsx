import { useSiteTranslation } from '@/i18n/siteCopy';
import type { ExecutionPlan } from '../services/redesignChatService';

export function StudioRuleFindings({ findings }: { findings?: ExecutionPlan['rule_findings'] }) {
  const { siteText: copy, siteValue } = useSiteTranslation();
  const visible = findings?.filter(row => row.level !== 'repaired') || [];
  const blocked = visible.some(row => row.level === 'blocked');
  if (!visible.length) return null;
  return <section role="status" aria-label={copy('موارد نیازمند بررسی طرح')}>
    <h4>{copy('موارد نیازمند بررسی طرح')}</h4>
    <p>{copy(blocked ? 'مغایرت‌های مشخص‌شده در تصویر اعمال نمی‌شوند؛ بقیهٔ طراحی حفظ می‌شود.'
      : 'ایدهٔ طراحی قابل نمایش است؛ اطلاعات نامشخص پیش از خرید و اجرای واقعی تکمیل می‌شود.')}</p>
    {visible.map(row => <p key={`${row.scene_id}:${row.rule_id}:${row.kind}:${row.target_id}:${row.action_id}`}>
      <strong>{copy(row.level === 'blocked' ? 'توقف همین اقدام' : row.rule_id.startsWith('purchase.') ? 'اطلاعات لازم پیش از خرید' : 'یادداشت طراحی')}{row.label_fa ? ` · ${siteValue(row.label_fa)}` : ''}</strong>
      {' — '}{siteValue(row.message_fa)}
    </p>)}
  </section>;
}
