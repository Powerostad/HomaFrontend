import { useTranslation } from 'react-i18next';
import type { SessionExpenses } from '../services/redesignChatService';

export function TokenCostEstimate({ estimate }: { estimate: SessionExpenses['token_estimate'] }) {
  const { t, i18n } = useTranslation();
  if (!estimate) return null;
  const money = (value: string | null) => value == null ? t('studioDiagnostics.unknown')
    : Number(value).toLocaleString(i18n.language, { maximumSignificantDigits: 8 });
  const range = (low: string | null, high: string | null) => low == null || high == null
    ? t('studioDiagnostics.unknown') : low === high ? `${money(low)} USD` : `${money(low)} – ${money(high)} USD`;
  return <section>
    <h4>{t('studioDiagnostics.tokenEstimate')}</h4>
    <p>{t(`studioDiagnostics.estimate_${estimate.status}`)}</p>
    <dl><dt>{t('studioDiagnostics.estimatedTextSubtotal')}</dt><dd>{range(estimate.lower_usd, estimate.upper_usd)}</dd></dl>
    <ul>{estimate.stages.map(stage => <li key={stage.stage}>
      {t(`studioDiagnostics.stage_${stage.stage}`, { defaultValue: stage.stage })}: {range(stage.estimated_calls ? stage.low : null, stage.estimated_calls ? stage.high : null)}
      {' · '}{t('studioDiagnostics.estimateCoverage', { known: stage.estimated_calls, total: stage.calls })}
    </li>)}</ul>
    <p className="studio-caption">{t('studioDiagnostics.estimateHint')}</p>
  </section>;
}
