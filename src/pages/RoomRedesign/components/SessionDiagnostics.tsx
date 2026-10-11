import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileJson, Loader2 } from 'lucide-react';
import { loadSessionDiagnostics, refreshSessionExpenses, type SessionDiagnosticsReport } from '../services/redesignChatService';

export function SessionDiagnostics({ sessionId }: { sessionId: string }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const ownerId = user?.id;
  const generation = useRef(0);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<SessionDiagnosticsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    generation.current += 1;
    setReport(null); setError(false);
    if (!open || !ownerId) { setLoading(false); return; }
    let active = true;
    setReport(null); setLoading(true); setError(false);
    void loadSessionDiagnostics(sessionId).then(result => {
      if (active) { setReport(result.data ?? null); setError(!result.success); setLoading(false); }
    });
    return () => { active = false; };
  }, [open, sessionId, ownerId]);
  const money = (value: string | null, currency: string) => value == null
    ? t('studioDiagnostics.unknown')
    : `${Number(value).toLocaleString(i18n.language, { maximumFractionDigits: currency === 'USD' ? 8 : 2 })} ${currency}`;
  const refresh = async () => {
    const stamp = generation.current;
    setLoading(true); setError(false);
    const result = await refreshSessionExpenses(sessionId);
    if (stamp !== generation.current) return;
    if (result.success && result.data && report) setReport({ ...report, expenses: result.data.expenses });
    else setError(true);
    setLoading(false);
  };
  const more = async () => {
    if (!report?.next_before) return;
    const stamp = generation.current;
    setLoading(true); setError(false);
    const result = await loadSessionDiagnostics(sessionId, report.next_before);
    if (stamp !== generation.current) return;
    if (result.success && result.data) setReport({ ...report, traces: [...report.traces, ...result.data.traces], next_before: result.data.next_before });
    else setError(true);
    setLoading(false);
  };
  const download = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `homa-session-${sessionId}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline"><FileJson size={18} aria-hidden="true" />{t('studioDiagnostics.title')}</Button></DialogTrigger>
    <DialogContent className="studio-diagnostics-dialog" dir={i18n.dir()}>
      <DialogHeader><DialogTitle>{t('studioDiagnostics.title')}</DialogTitle><DialogDescription>{t('studioDiagnostics.hint')}</DialogDescription></DialogHeader>
      <div className="studio-diagnostics-body">
        <p className="studio-caption">{t('studioDiagnostics.session')} <bdi>{sessionId}</bdi></p>
        {loading && <p role="status"><Loader2 size={18} className="studio-spinner" aria-hidden="true" />{t('studioDiagnostics.loading')}</p>}
        {error && <p role="alert">{t('studioDiagnostics.error')}</p>}
        {report && <>
          <section className="studio-diagnostics-cost"><h3>{t('studioDiagnostics.cost')}</h3>
            <p>{t(`studioDiagnostics.${report.expenses.status}`)}</p>
            <dl><div><dt>{t('studioDiagnostics.total')}</dt><dd>{money(report.expenses.known_usd, 'USD')}</dd></div>
              <div><dt>{t('studioDiagnostics.text')}</dt><dd>{money(report.expenses.text_usd, 'USD')}</dd></div>
              <div><dt>{t('studioDiagnostics.image')}</dt><dd>{money(report.expenses.image_usd, 'USD')}</dd></div>
              <div><dt>{t('studioDiagnostics.paid')}</dt><dd>{money(report.expenses.known_paid_toman, t('redesignJourney.toman'))}</dd></div>
              <div><dt>{t('studioDiagnostics.grant')}</dt><dd>{money(report.expenses.known_grant_toman, t('redesignJourney.toman'))}</dd></div></dl>
            <p className="studio-caption">{t('studioDiagnostics.costHint')}</p>
            <p>{t('studioDiagnostics.gaps', { unknown: report.expenses.unknown_calls, pending: report.expenses.pending_receipts })}</p>
            {report.expenses.checked_at && <p className="studio-caption">{new Date(report.expenses.checked_at).toLocaleString(i18n.language)}</p>}
            {report.expenses.refresh_status && <p role="status">{t(`studioDiagnostics.refresh_${report.expenses.refresh_status}`)}</p>}
            <Button disabled={loading} variant="outline" onClick={() => void refresh()}>{t('studioDiagnostics.refresh')}</Button>
          </section>
          <section><h3>{t('studioDiagnostics.current')}</h3><p className="studio-caption">{t('studioDiagnostics.currentHint')}</p><JsonValue value={report.documents} /></section>
          <details><summary>{t('studioDiagnostics.versions')}</summary><JsonValue value={report.versions} /></details>
          <section><h3>{t('studioDiagnostics.steps')}</h3><p className="studio-caption">{t('studioDiagnostics.stepsHint')}</p>
            {report.traces.map(trace => <details key={trace.id}><summary><bdi>{trace.payload_name || trace.step_name}</bdi> · <bdi>{trace.model || trace.status}</bdi> · {t('studioDiagnostics.turn')} {trace.turn_index ?? '—'}</summary><JsonValue value={trace} /></details>)}
            {report.next_before && <Button variant="outline" disabled={loading} onClick={() => void more()}>{t('studioDiagnostics.more')}</Button>}
          </section>
          <Button disabled={loading} onClick={download}><Download size={18} aria-hidden="true" />{t('studioDiagnostics.download')}</Button>
          <p className="studio-caption">{t('studioDiagnostics.private')}</p>
        </>}
      </div>
    </DialogContent>
  </Dialog>;
}

export function JsonValue({ value }: { value: unknown }) {
  // Diagnostic data is deliberately not translated, formatted as HTML or run.
  return <pre className="studio-diagnostics-json" dir="ltr">{JSON.stringify(value, null, 2)}</pre>;
}
