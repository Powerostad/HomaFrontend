import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Copy, Download, FileJson, Loader2 } from 'lucide-react';
import { PerformancePanel } from './PerformancePanel';
import { loadSessionDiagnostics, type SessionDiagnosticsReport } from '../services/redesignChatService';
import { useSessionExpenses } from '../hooks/useSessionExpenses';
import { TokenCostEstimate } from './TokenCostEstimate';

export function SessionDiagnostics({ sessionId, busy = false }: { sessionId: string; busy?: boolean }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const ownerId = user?.id;
  const contentId = useId();
  const generation = useRef(0);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<SessionDiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [billingRevision, setBillingRevision] = useState(0);
  const [revision, setRevision] = useState(0);
  const liveExpenses = useSessionExpenses(sessionId, open, busy, billingRevision);
  const expenses = liveExpenses ?? report?.expenses;
  useEffect(() => {
    generation.current += 1;
    setReport(null); setError(false);
    if (!open || !ownerId) { setLoading(false); return; }
    let active = true;
    setReport(null); setLoading(true); setError(false);
    void loadSessionDiagnostics(sessionId).then(result => {
      if (active) { setReport(result.data ?? null); setError(!result.success); setLoading(false); }
    }).catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [open, sessionId, ownerId, busy, revision]);
  const money = (value: string | null, currency: string) => value == null
    ? t('studioDiagnostics.unknown')
    : `${Number(value).toLocaleString(i18n.language, currency === 'USD' ? { maximumSignificantDigits: 10 } : { maximumFractionDigits: 2 })} ${currency}`;
  const refresh = () => setBillingRevision(value => value + 1);
  const more = async () => {
    if (!report?.next_before) return;
    const stamp = generation.current;
    setLoading(true); setError(false);
    try {
      const result = await loadSessionDiagnostics(sessionId, report.next_before);
      if (stamp !== generation.current) return;
      if (result.success && result.data) setReport({ ...report, traces: [...report.traces, ...result.data.traces], next_before: result.data.next_before });
      else setError(true);
    } catch { if (stamp === generation.current) setError(true); }
    finally { if (stamp === generation.current) setLoading(false); }
  };
  const download = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...report, expenses }, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `homa-session-${sessionId}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="studio-unified-report" dir={i18n.dir()}>
    <Button className="studio-report-trigger" variant="ghost" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(value => !value)}><FileJson size={20} aria-hidden="true" /><span>{t('studioReport.reportTitle')}</span><ChevronDown size={18} aria-hidden="true" /></Button>
    {open && <div id={contentId} className="studio-diagnostics-body">
        <p className="studio-caption">{t('studioDiagnostics.hint')}</p>
        <p className="studio-caption">{t('studioDiagnostics.session')} <bdi>{sessionId}</bdi></p>
        <PerformancePanel key={`${sessionId}/${ownerId}`} sessionId={sessionId} busy={busy} embedded />
        {loading && <p role="status"><Loader2 size={18} className="studio-spinner" aria-hidden="true" />{t('studioDiagnostics.loading')}</p>}
        {error && <div><p role="alert">{t('studioDiagnostics.error')}</p><Button variant="outline" disabled={loading || busy} onClick={() => setRevision(value => value + 1)}>{t('redesignJourney.retry')}</Button></div>}
        {report && <>
          <section className="studio-diagnostics-cost"><h3>{t('studioDiagnostics.cost')}</h3>
            <p>{t(`studioDiagnostics.${expenses!.status}`)}</p>
            <dl><div><dt>{t('studioDiagnostics.total')}</dt><dd>{money(expenses!.known_usd, 'USD')}</dd></div>
              <div><dt>{t('studioDiagnostics.text')}</dt><dd>{money(expenses!.text_usd, 'USD')}</dd></div>
              <div><dt>{t('studioDiagnostics.image')}</dt><dd>{money(expenses!.image_usd, 'USD')}</dd></div>
              <div><dt>{t('studioDiagnostics.paid')}</dt><dd>{money(expenses!.known_paid_toman, t('redesignJourney.toman'))}</dd></div>
              <div><dt>{t('studioDiagnostics.grant')}</dt><dd>{money(expenses!.known_grant_toman, t('redesignJourney.toman'))}</dd></div></dl>
            <p className="studio-caption">{t('studioDiagnostics.costHint')}</p>
            <TokenCostEstimate estimate={expenses!.token_estimate} />
            {!!expenses?.receipts?.length && <details>
              <summary>{t('studioDiagnostics.cost')} · {t('studioDiagnostics.steps')}</summary>
              <ul>{expenses.receipts.map(receipt => <li key={receipt.request_id}>
                <bdi>{t(`studioDiagnostics.stage_${receipt.stage}`, { defaultValue: receipt.stage || receipt.kind })}</bdi>
                {' · '}<bdi>{receipt.model}</bdi>
                {' · '}{t('studioDiagnostics.turn')} {receipt.turn_index ?? '—'}
                {receipt.attempt != null && <> · #{receipt.attempt}</>}
                <dl>
                  <dt>{t('studioDiagnostics.total')}</dt><dd>{money(receipt.usd, 'USD')}</dd>
                  <dt>{t('studioDiagnostics.paid')}</dt><dd>{money(receipt.paid_toman ?? null, t('redesignJourney.toman'))}</dd>
                  <dt>{t('studioDiagnostics.grant')}</dt><dd>{money(receipt.grant_toman ?? null, t('redesignJourney.toman'))}</dd>
                </dl>
                <small><bdi>{receipt.request_id}</bdi></small>
              </li>)}</ul>
            </details>}
            <p>{t('studioDiagnostics.gaps', { unknown: expenses!.unknown_calls, pending: expenses!.pending_receipts })}</p>
            {expenses!.checked_at && <p className="studio-caption">{new Date(expenses!.checked_at).toLocaleString(i18n.language)}</p>}
            {report.expenses.refresh_status && <p role="status">{t(`studioDiagnostics.refresh_${report.expenses.refresh_status}`)}</p>}
            <Button disabled={loading || busy} variant="outline" onClick={refresh}>{t('studioDiagnostics.refresh')}</Button>
          </section>
          <details><summary>{t('studioDiagnostics.current')}</summary><p className="studio-caption">{t('studioDiagnostics.currentHint')}</p><JsonValue value={report.documents} /></details>
          <details><summary>{t('studioDiagnostics.versions')}</summary><JsonValue value={report.versions} /></details>
          <section><h3>{t('studioDiagnostics.handoffs')}</h3><p className="studio-caption">{t('studioDiagnostics.handoffHint')}</p>
            {!report.traces.some(trace => trace.payload_name?.startsWith('handoff-')) && <p>{t('studioDiagnostics.noHandoffs')}</p>}
            {report.traces.filter(trace => trace.payload_name?.startsWith('handoff-')).map(trace =>
              <details key={trace.id}><summary>{t(`studioDiagnostics.${trace.payload_name.startsWith('handoff-compiled-') ? 'compiledOutput' : trace.payload_name.startsWith('handoff-analysis-') ? 'analysisInput' : trace.payload_name.startsWith('handoff-image-') ? 'imageInput' : 'searchInput'}`)} · {t('studioDiagnostics.turn')} {trace.turn_index ?? '—'}</summary>
                <HandoffDetails value={trace.payload} />
              </details>)}
          </section>
          <section><h3>{t('studioDiagnostics.steps')}</h3><p className="studio-caption">{t('studioDiagnostics.stepsHint')}</p>
            {report.traces.filter(trace => !trace.payload_name?.startsWith('handoff-')).map(trace => <details key={trace.id}><summary><bdi>{trace.payload_name || trace.step_name}</bdi> · <bdi>{trace.model || trace.status}</bdi> · {t('studioDiagnostics.turn')} {trace.turn_index ?? '—'}</summary><JsonValue value={trace} /></details>)}
            {report.next_before && <Button variant="outline" disabled={loading} onClick={() => void more()}>{t('studioDiagnostics.more')}</Button>}
          </section>
          <Button disabled={loading} onClick={download}><Download size={18} aria-hidden="true" />{t('studioDiagnostics.download')}</Button>
          <p className="studio-caption">{t('studioDiagnostics.private')}</p>
        </>}
      </div>}
  </section>;
}

export function HandoffDetails({ value }: { value: unknown }) {
  const { t } = useTranslation();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return <JsonValue value={value} />;
  const data = value as Record<string, unknown>;
  if (data.stage !== 'image_input' || data.truncated) return <JsonValue value={value} />;
  return <>
    <details><summary>{t('studioDiagnostics.canonicalOutput')}</summary><JsonValue value={data.canonical_document} /></details>
    <details><summary>{t('studioDiagnostics.actualImagePrompt')}</summary><JsonValue value={data.actual_prompt} /></details>
    <details><summary>{t('studioDiagnostics.amendments')}</summary><JsonValue value={{ execution_amendments: data.execution_amendments, excluded_products: data.excluded_products, explicit_user_constraints: data.explicit_user_constraints, changes_from_selected_version: data.changes_from_selected_version }} /></details>
  </>;
}

export function JsonValue({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => { setCopyState('idle'); }, [value]);
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopyState('copied'); }
    catch { setCopyState('error'); }
  };
  // Diagnostic data is deliberately not translated, formatted as HTML or run.
  return <div className="studio-report-code"><div className="studio-report-copy"><Button variant="outline" disabled={!text} onClick={() => void copy()}>{copyState === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{t(copyState === 'copied' ? 'studioReport.copied' : 'studioReport.copy')}</Button><span role="status">{copyState === 'error' && t('studioReport.copyError')}</span></div><pre className="studio-diagnostics-json" dir="ltr" tabIndex={0}>{text}</pre></div>;
}
