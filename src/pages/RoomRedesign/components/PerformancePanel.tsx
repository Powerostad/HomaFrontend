import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadStudioPerformance, type StudioPerformanceReport } from '../services/redesignChatService';

export function PerformancePanel({ sessionId, busy }: { sessionId: string; busy: boolean }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [report, setReport] = useState<StudioPerformanceReport | null>(null);
  const [loading, setLoading] = useState(false);
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
  return <section className="studio-plan-summary" dir={i18n.dir()}>
    <Tabs value={open} onValueChange={setOpen}>
      <TabsList><TabsTrigger value="performance">{t('studioPerformance.title')}</TabsTrigger></TabsList>
      <TabsContent value="performance">
        <p>{t('studioPerformance.hint')}</p>
        <Button variant="outline" disabled={loading || busy} onClick={() => setRefresh(value => value + 1)}>{t('studioPerformance.refresh')}</Button>
        {loading || busy ? <p role="status">{t('studioPerformance.pending')}</p> : !report?.summary ? <p>{t('studioPerformance.unavailable')}</p> : <>
          {report.status === 'pending' && <p role="status">{t('studioPerformance.pending')}</p>}
          <dl>
            <dt>{t('studioPerformance.elapsed')}</dt><dd>{number(report.summary.trace_elapsed_timestamp_ms)} ms</dd>
            <dt>{t('studioPerformance.calls')}</dt><dd>{number(report.summary.api_calls)}</dd>
            <dt>{t('studioPerformance.cost')}</dt><dd>{number(report.summary.estimated_cost_usd)} USD</dd>
            <dt>{t('studioPerformance.input')}</dt><dd>{number(report.summary.tokens.input_tokens)}</dd>
            <dt>{t('studioPerformance.output')}</dt><dd>{number(report.summary.tokens.output_tokens)}</dd>
          </dl>
          <ul>{report.runs.map(run => <li key={run.id}>{run.workflow} · {run.status} · {number(run.duration_ms)} ms</li>)}</ul>
          <details><summary>{t('studioPerformance.stages')}</summary><ul>{report.spans.map(span => <li key={span.id}>{span.name} · {span.status} · {number(span.duration_ms)} ms</li>)}</ul></details>
        </>}
      </TabsContent>
    </Tabs>
  </section>;
}
