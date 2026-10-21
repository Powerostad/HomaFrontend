import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { siteText, useSiteTranslation } from '@/i18n/siteCopy';
import { apiGet, apiPost, fetchAuthenticatedImage } from '@/utils/apiClient';
import { appConfig } from '@/config/appConfig';

type ExportReport = { mode: 'export' | 'api'; exports: { export_id: string; created_at: string; reference_count: number; design_version_id?: string }[] };

export function StudioImageExport({ sessionId, busy }: { sessionId: string; busy: boolean }) {
  const { siteText: copy } = useSiteTranslation();
  const [report, setReport] = useState<ExportReport | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const endpoint = `/recommendations/chat/sessions/${sessionId}/image-export/`;
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await apiGet<ExportReport>(endpoint);
        if (active && result.success && result.data) { setReport(result.data); setError(''); }
        else if (active) setError(siteText('اطلاعات بستهٔ تصویر دریافت نشد.'));
      } catch { if (active) setError(siteText('اطلاعات بستهٔ تصویر دریافت نشد.')); }
    };
    void load();
    const timer = busy ? window.setInterval(() => void load(), 4000) : undefined;
    return () => { active = false; window.clearInterval(timer); };
  }, [endpoint, busy, revision]);
  const mode = async (value: 'export' | 'api') => {
    setWorking(true); setError('');
    try {
      const result = await apiPost(endpoint, { mode: value });
      if (!result.success) throw new Error();
      setReport(previous => previous ? { ...previous, mode: value } : previous);
    } catch { setError(copy('تغییر حالت انجام نشد؛ ابتدا صبر کن درخواست فعلی تمام شود.')); }
    finally { setWorking(false); }
  };
  const download = async (id: string, format: 'zip' | 'html') => {
    setWorking(true); setError('');
    try {
      const target = new URL(`/api${endpoint}?download=${encodeURIComponent(id)}&format=${format}`, appConfig.apiBaseUrl);
      const url = await fetchAuthenticatedImage(target.toString());
      const link = document.createElement('a');
      link.href = url; link.download = `homa-image-input-${id}.${format}`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError(copy('دانلود بسته انجام نشد؛ دوباره تلاش کن.')); }
    finally { setWorking(false); }
  };
  return <section className="studio-unified-report studio-image-export" aria-label={copy('خروجی تصویر برای R&D')}>
    <h3>{copy('خروجی تصویر برای R&D')}</h3>
    <p>{copy(report?.mode === 'api' ? 'تولید تصویر با API فعال است و هزینه دارد.' : 'حالت بستهٔ ورودی: طراحی و جست‌وجو اجرا می‌شوند؛ تصویرساز فراخوانی نمی‌شود.')}</p>
    {report && <label>{copy('روش آماده‌سازی تصویر')} <select disabled={busy || working} value={report.mode}
      onChange={event => void mode(event.target.value as 'export' | 'api')}>
      <option value="export">{copy('بستهٔ ورودی برای ChatGPT')}</option>
      <option value="api">{copy('تولید تصویر با API — دارای هزینه')}</option>
    </select></label>}
    {error && <p role="alert">{error} <Button variant="outline" disabled={working} onClick={() => setRevision(value => value + 1)}>{copy('تلاش دوباره')}</Button></p>}
    {!!report?.exports.length && <><p>{copy('ZIP را استخراج کن؛ تصاویر شماره‌دار را به همان ترتیب در ChatGPT پیوست کن و متن prompt.txt را کامل بفرست. HTML برای مرور آفلاین است.')}</p>
      <details open><summary>{copy('بسته‌های آماده')}</summary>{report.exports.map((item, index) => <div key={item.export_id} className="studio-image-export-row">
        <span>{copy(index === 0 ? 'آخرین بسته' : 'بستهٔ قبلی')} · <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time> · {item.reference_count} {copy('تصویر مرجع')}</span>
        <Button variant="outline" disabled={working} onClick={() => void download(item.export_id, 'zip')}>{copy('دانلود ZIP')}</Button>
        <Button variant="outline" disabled={working} onClick={() => void download(item.export_id, 'html')}>{copy('دانلود HTML')}</Button>
      </div>)}</details></>}
    {report && !report.exports.length && <p>{copy('پس از تکمیل طراحی و آماده‌سازی تصاویر مرجع، بسته اینجا نمایش داده می‌شود.')}</p>}
  </section>;
}
