import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { loadStudioPerformance, type StudioPerformanceReport } from '../services/redesignChatService';
import { useSessionExpenses } from '../hooks/useSessionExpenses';
import { durationParts, stageKey } from '../services/diagnosticFormatting';

export function PerformancePanel({ sessionId, busy, embedded = false }: { sessionId: string; busy: boolean; embedded?: boolean }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(embedded ? 'performance' : '');
  const [refresh, setRefresh] = useState(0);
  const [report, setReport] = useState<StudioPerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const expenses = useSessionExpenses(sessionId, !!open && !embedded, busy, refresh);
  useEffect(() => {
    let active = true;
    setReport(null);
    if (!open || busy || !user?.id) { setLoading(false); return; }
    setLoading(true);
    void loadStudioPerformance(sessionId).then(result => {
      if (active) { setReport(result.success ? result.data ?? null : null); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sessionId, user?.id, open, busy, refresh]);
  const number = (value: number | null | undefined) => value == null ? t('studioDiagnostics.unknown') : value.toLocaleString(i18n.language, { maximumFractionDigits: 2 });
  const usd = (value: number | string | null | undefined) => value == null ? t('studioDiagnostics.unknown') : Number(value).toLocaleString(i18n.language, { maximumSignificantDigits: 10 });
  const duration = (value: number | null | undefined) => {
    const parts = durationParts(value);
    if (!parts) return t('studioDiagnostics.unknown');
    return `${parts.minutes ? `${number(parts.minutes)} ${t('studioAudit.minutes')} ` : ''}${number(parts.seconds)} ${t('studioAudit.seconds')}`;
  };
  return <section className="studio-plan-summary studio-performance" dir={i18n.dir()}>
      {embedded ? <h3>{t('studioPerformance.title')}</h3> : <Button variant="outline" aria-expanded={!!open} onClick={() => setOpen(value => value ? '' : 'performance')}>{t('studioPerformance.title')}</Button>}
      {!!open && <div>
        <p>{t('studioPerformance.hint')}</p>
        <Button variant="outline" disabled={loading || busy} onClick={() => setRefresh(value => value + 1)}>{t('studioPerformance.refresh')}</Button>
        {loading || busy ? <p role="status">{t('studioPerformance.pending')}</p> : !report?.summary ? <p>{t('studioPerformance.unavailable')}</p> : <>
          {report.status === 'pending' && <p role="status">{t('studioPerformance.pending')}</p>}
          <p className="studio-caption">{t('studioAudit.timeHint')}</p>
          <dl className="studio-metric-grid">
            <div><dt>{t('studioPerformance.elapsed')}</dt><dd title={`${report.summary.trace_elapsed_timestamp_ms ?? '—'} ms`}>{duration(report.summary.trace_elapsed_timestamp_ms)}</dd></div>
            <div><dt>{t('studioPerformance.calls')}</dt><dd>{number(report.summary.api_calls)}</dd></div>
            {!embedded && <><dt>{t('studioPerformance.cost')}</dt><dd>{usd(report.summary.estimated_cost_usd)} USD</dd></>}
            <div><dt>{t('studioPerformance.input')}</dt><dd>{number(report.summary.tokens.input_tokens)}</dd></div>
            <div><dt>{t('studioPerformance.output')}</dt><dd>{number(report.summary.tokens.output_tokens)}</dd></div>
          </dl>
          <div className="studio-audit-table-wrap"><table className="studio-audit-table"><caption>{t('studioAudit.time')}</caption><thead><tr><th>{t('studioAudit.stage')}</th><th>{t('studioAudit.status')}</th><th>{t('studioAudit.duration')}</th></tr></thead><tbody>{report.runs.map((run, index) => <tr key={run.id}><th scope="row"><span>{t(`studioAudit.${stageKey(run.workflow)}`)}</span><small><bdi>{index + 1} · {run.started_at ? new Date(run.started_at).toLocaleTimeString(i18n.language) : ''}</bdi></small></th><td><span className="studio-audit-status" data-status={run.status}>{t(`studioAudit.${run.status}`, { defaultValue: run.status })}</span></td><td title={`${run.duration_ms ?? '—'} ms`}>{duration(run.duration_ms)}</td></tr>)}</tbody></table></div>
          <details><summary>{t('studioPerformance.stages')}</summary><div className="studio-audit-table-wrap"><table className="studio-audit-table"><thead><tr>{['stage', 'model', 'duration', 'input', 'output'].map(key => <th key={key}>{t(`studioAudit.${key}`)}</th>)}</tr></thead><tbody>{report.spans.map(span => <tr key={span.id}><th scope="row">{t(`studioAudit.${stageKey(String(span.metrics?.step || span.name))}`)}<small><bdi>{span.name}</bdi></small></th><td><bdi>{span.metrics?.model || '—'}</bdi></td><td title={`${span.duration_ms} ms`}>{duration(span.duration_ms)}</td><td>{number(typeof span.metrics?.input_tokens === 'number' ? span.metrics.input_tokens : null)}</td><td>{number(typeof span.metrics?.output_tokens === 'number' ? span.metrics.output_tokens : null)}</td></tr>)}</tbody></table></div></details>
        </>}
        {!busy && expenses && <section>
          <h3>{t('studioDiagnostics.cost')}</h3>
          <p>{t(`studioDiagnostics.${expenses.status}`)}</p>
          <dl>
            <dt>{t('studioDiagnostics.total')}</dt><dd>{usd(expenses.known_usd)} USD</dd>
            <dt>{t('studioDiagnostics.text')}</dt><dd>{usd(expenses.text_usd)} USD</dd>
            <dt>{t('studioDiagnostics.image')}</dt><dd>{usd(expenses.image_usd)} USD</dd>
          </dl>
          <p>{t('studioDiagnostics.gaps', { unknown: expenses.unknown_calls, pending: expenses.pending_receipts })}</p>
          <p>{t('studioDiagnostics.costHint')}</p>
        </section>}
      </div>}
  </section>;
}
