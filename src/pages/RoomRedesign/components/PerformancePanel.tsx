import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { loadStudioPerformance, type StudioPerformanceReport } from '../services/redesignChatService';
import { useSessionExpenses } from '../hooks/useSessionExpenses';

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
  return <section className="studio-plan-summary studio-performance" dir={i18n.dir()}>
      {embedded ? <h3>{t('studioPerformance.title')}</h3> : <Button variant="outline" aria-expanded={!!open} onClick={() => setOpen(value => value ? '' : 'performance')}>{t('studioPerformance.title')}</Button>}
      {!!open && <div>
        <p>{t('studioPerformance.hint')}</p>
        <Button variant="outline" disabled={loading || busy} onClick={() => setRefresh(value => value + 1)}>{t('studioPerformance.refresh')}</Button>
        {loading || busy ? <p role="status">{t('studioPerformance.pending')}</p> : !report?.summary ? <p>{t('studioPerformance.unavailable')}</p> : <>
          {report.status === 'pending' && <p role="status">{t('studioPerformance.pending')}</p>}
          <dl>
            <dt>{t('studioPerformance.elapsed')}</dt><dd>{number(report.summary.trace_elapsed_timestamp_ms)} ms</dd>
            <dt>{t('studioPerformance.calls')}</dt><dd>{number(report.summary.api_calls)}</dd>
            {!embedded && <><dt>{t('studioPerformance.cost')}</dt><dd>{usd(report.summary.estimated_cost_usd)} USD</dd></>}
            <dt>{t('studioPerformance.input')}</dt><dd>{number(report.summary.tokens.input_tokens)}</dd>
            <dt>{t('studioPerformance.output')}</dt><dd>{number(report.summary.tokens.output_tokens)}</dd>
          </dl>
          <ul>{report.runs.map(run => <li key={run.id}>{run.workflow} · {run.status} · {number(run.duration_ms)} ms</li>)}</ul>
          <details><summary>{t('studioPerformance.stages')}</summary><ul>{report.spans.map(span => <li key={span.id}>{span.name} · {span.status} · {number(span.duration_ms)} ms</li>)}</ul></details>
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
