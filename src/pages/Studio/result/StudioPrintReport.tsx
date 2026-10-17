import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatPriceFromRial } from '@/utils/formatters';
import type { DiscoveryReview } from '../../RoomRedesign/services/discoveryReview';
import { buildPrintReport, type PrintReportState } from './printReportModel';
import './studio-print.css';

/** Wait for fonts and eager images before opening the browser's print dialog. */
export async function waitForPrintAssets(root: HTMLElement, timeout = 12000): Promise<boolean> {
  const cleanups: Array<() => void> = [];
  let timer: ReturnType<typeof setTimeout>;
  const images = Array.from(root.querySelectorAll('img')).map(img => new Promise<void>(resolve => {
    if (img.complete) { resolve(); return; }
    const done = () => resolve();
    img.addEventListener('load', done, { once:true }); img.addEventListener('error', done, { once:true });
    cleanups.push(() => { img.removeEventListener('load', done); img.removeEventListener('error', done); });
  }));
  try {
    return await Promise.race([
      Promise.all([...images, document.fonts?.ready ?? Promise.resolve()]).then(() => true),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), timeout); }),
    ]);
  } catch { return false; }
  finally { clearTimeout(timer!); cleanups.forEach(cleanup => cleanup()); }
}

function ReportImage({ src, label }: { src:string | null; label:string }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  return <figure><figcaption>{label}</figcaption>{src && !failed ? <img src={src} alt={label} loading="eager" onError={() => setFailed(true)} /> : <p className="studio-print-missing">{t('studioPrint.missingImage')}</p>}</figure>;
}

export function PrintReportDocument({ state, review, date }: { state:PrintReportState; review?:DiscoveryReview; date:string }) {
  const { t, i18n } = useTranslation();
  const report = buildPrintReport(state, review);
  const count = (value:number) => value.toLocaleString(i18n.language);
  return <article className="studio-print-document" dir={i18n.dir()}>
    <header className="studio-print-header"><strong lang="en">HOMA</strong><p>{t('studioPrint.title')}</p></header>
    <h1>{report.title || t('studio.result.v2.roomFallback')}</h1>
    <p className="studio-print-date">{t('studioPrint.date')} {new Date(date).toLocaleDateString(i18n.language)}</p>
    <section className="studio-print-comparison"><ReportImage key={`before:${report.before}`} src={report.before} label={t('studioPrint.before')} /><ReportImage key={`after:${report.after}`} src={report.after} label={t('studioPrint.after')} /></section>
    {(report.summary || report.direction) && <section><h2>{t('studioPrint.summary')}</h2><p>{report.summary}</p>{report.direction && <p>{report.direction}</p>}</section>}
    <section><h2>{t('studioPrint.problems')}</h2>{report.findings.length ? report.findings.map((finding, index) => <div className="studio-print-finding" key={finding.id}><h3>{count(index + 1)}. {finding.observation}</h3>{finding.suggestion && <p>{t('studioPrint.solution')}: {finding.suggestion}</p>}</div>) : <p>{t('studioPrint.noProblems')}</p>}</section>
    <section><h2>{t('studioPrint.changes')}</h2>{report.changes.length ? <ol>{report.changes.map(change => <li key={change.id}><h3>{change.title}</h3><p>{change.detail || change.reason}</p></li>)}</ol> : <p>{t('studioPrint.noChanges')}</p>}</section>
    <section className="studio-print-products"><h2>{t('studioPrint.products')}</h2><p>{t('studioPrint.selectionHint')}</p>{!report.products.length && <p>{t('studioPrint.noProducts')}</p>}
      {report.products.map(({ product, quantity, selected, reason, placement, known }) => <div key={product.id} className="studio-print-product">
        <ReportImage key={product.image} src={product.image} label={product.name} />
        <div><h3>{product.name}</h3><p>{t(selected ? 'studioPrint.selected' : 'studioPrint.recommended')}</p>{reason && <p>{reason}</p>}{placement && placement !== reason && <p>{placement}</p>}
          <dl><div><dt>{t('studioPrint.quantity')}</dt><dd>{count(quantity)}</dd></div><div><dt>{t('studioPrint.unitPrice')}</dt><dd>{known ? formatPriceFromRial(product.price) : t('studioPrint.unknown')}</dd></div><div><dt>{t('studioPrint.lineTotal')}</dt><dd>{known ? formatPriceFromRial(product.price * quantity) : t('studioPrint.unknown')}</dd></div></dl>
          {product.store && <p>{t('studioPrint.store')}: {product.store}</p>}
        </div>
      </div>)}
      {!!report.products.length && <div className="studio-print-total"><strong>{t('studioPrint.knownSubtotal')}: {report.knownSubtotal > 0 ? formatPriceFromRial(report.knownSubtotal) : t('studioPrint.unknown')}</strong><p>{t('studioPrint.costHint')}</p>{report.unknownCount > 0 && <p>{t('studioPrint.unknownCount', { count:report.unknownCount })}</p>}</div>}
    </section>
    {[['layout', report.layout], ['services', report.services]].map(([kind, groups]) => Array.isArray(groups) && groups.length > 0 && <section key={String(kind)}><h2>{t(`studioPrint.${kind}`)}</h2><ul>{groups.map(group => <li key={group.itemId}><h3>{group.categoryDisplay}</h3><p>{group.actionGuidance || group.designRationaleFa || group.recommendationReasonFa}</p></li>)}</ul></section>)}
    <footer>{t('studioPrint.footer')}</footer>
  </article>;
}

export function StudioPrintReport({ state, review, busy = false }: { state:PrintReportState; review?:DiscoveryReview; busy?:boolean }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(false);
  const printRoot = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const print = async () => {
    if (lock.current || !printRoot.current) return;
    lock.current = true; setPreparing(true); setError(false);
    try {
      if (!await waitForPrintAssets(printRoot.current)) { setError(true); return; }
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (!printRoot.current || !document.body.contains(printRoot.current)) return;
      window.print();
    } catch { setError(true); }
    finally { lock.current = false; setPreparing(false); }
  };
  return <>
    <Dialog open={open} onOpenChange={value => { if (!preparing) { setOpen(value); setError(false); if (value) setDate(new Date().toISOString()); } }}>
      <DialogTrigger asChild><Button variant="outline" className="studio-print-trigger" disabled={busy}><Printer size={18} aria-hidden="true" />{t('studioPrint.trigger')}</Button></DialogTrigger>
      <DialogContent className="studio-print-dialog" dir={i18n.dir()}><DialogHeader><DialogTitle>{t('studioPrint.title')}</DialogTitle><DialogDescription>{t('studioPrint.hint')}</DialogDescription></DialogHeader>
        <div className="studio-print-controls"><Button disabled={preparing} onClick={() => void print()}>{t(preparing ? 'studioPrint.preparing' : 'studioPrint.print')}</Button>{error && <p role="alert">{t('studioPrint.error')}</p>}</div>
        <div className="studio-print-preview"><PrintReportDocument state={state} review={review} date={date} /></div>
      </DialogContent>
    </Dialog>
    {open && createPortal(<div ref={printRoot} className="homa-print-root" aria-hidden="true"><PrintReportDocument state={state} review={review} date={date} /></div>, document.body)}
  </>;
}
