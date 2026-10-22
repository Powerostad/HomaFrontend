import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { loadChatSession, loadSessionDiagnostics, loadStudioPerformance, type SessionPayload } from '../RoomRedesign/services/redesignChatService';
import { dimensions, format, fromSession, imageSource, localSessionId, newCase, parseArm, parseCases, replaceArm, totals, vote,
  type ArmKey, type Choice, type ComparisonArm, type ComparisonCase, type Dimension } from './comparison';
import { loadWorkspace, saveWorkspace } from './storage';
import { importRenderFiles } from './importRenderFiles';
import './comparison.css';

const dimensionLabels = { design: 'کیفیت تشخیص و طراحی', products: 'تناسب محصولات پیشنهادی', image: 'کیفیت و وفاداری تصویر' };
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function download(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function readPhoto(file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) throw new Error('image');
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file);
  });
}
function Photo({ src, alt }: { src: string | null; alt: string }) {
  const { siteText: copy } = useSiteTranslation();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? <img src={src} alt={alt} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <div className="comparison-photo-missing">{copy(src ? 'تصویر بارگذاری نشد؛ می‌توانی فایل آن را دوباره وارد کنی.' : 'تصویری ثبت نشده است.')}</div>;
}
function VoteForm({ item, dimension, onSave }: { item: ComparisonCase; dimension: Dimension; onSave: (choice: Choice, note: string, judge: string) => void }) {
  const { siteText: copy } = useSiteTranslation();
  const saved = item.votes[dimension];
  const [choice, setChoice] = useState<Choice>(saved?.choice || 'unassessed');
  const [note, setNote] = useState(saved?.note || '');
  const [judge, setJudge] = useState(saved?.judge || '');
  useEffect(() => { setChoice(saved?.choice || 'unassessed'); setNote(saved?.note || ''); setJudge(saved?.judge || ''); }, [saved?.savedAt, saved?.choice, saved?.note, saved?.judge]);
  const options: [Choice, string][] = [[item.order[0], 'گزینهٔ ۱ بهتر است'], [item.order[1], 'گزینهٔ ۲ بهتر است'], ['tie', 'برابرند'], ['neither', 'هیچ‌کدام مناسب نیست'], ['unassessed', 'اطلاعات کافی ندارم']];
  return <form className="comparison-vote" onSubmit={event => { event.preventDefault(); onSave(choice, note, judge); }}>
    <fieldset><legend>{copy(dimensionLabels[dimension])}</legend>{options.map(([value, label]) => <label key={value}><input type="radio" name={`vote-${item.id}-${dimension}`} value={value} checked={choice === value} disabled={value !== 'unassessed' && (!item.arms.A || !item.arms.B)} onChange={() => setChoice(value)} />{copy(label)}</label>)}</fieldset>
    <label>{copy('دلیل و شواهد انتخاب')}<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={4000} rows={3} /></label>
    <label>{copy('نام ارزیاب')}<input value={judge} onChange={event => setJudge(event.target.value)} maxLength={100} /></label>
    <Button type="submit" variant="outline">{copy('ثبت ارزیابی')}</Button>
    {saved && <p role="status">{copy('ثبت شد')} · {copy(saved.blind ? 'پیش از نمایش منابع' : 'پس از نمایش منابع')}</p>}
  </form>;
}

function ArmPanel({ arm, index, revealed }: { arm: ComparisonArm | null; index: number; revealed: boolean }) {
  const { siteText: copy, siteLocale } = useSiteTranslation();
  const display = (value: number | null, unit: string) => value == null ? copy('ثبت نشده') : `${value.toLocaleString(siteLocale(), { maximumFractionDigits: 5 })} ${unit}`;
  return <article className="comparison-arm">
    <header><span>{copy(index === 0 ? 'گزینهٔ ۱' : 'گزینهٔ ۲')}</span>{arm && <b className={`comparison-status comparison-status-${arm.status}`}>{copy(arm.status === 'failed' ? 'اجرای ناموفق' : arm.status === 'partial' ? 'خروجی ناقص یا وضعیت نامشخص' : 'خروجی ثبت‌شده')}</b>}</header>
    <Photo src={arm?.resultImage || null} alt={copy(index === 0 ? 'تصویر گزینهٔ ۱' : 'تصویر گزینهٔ ۲')} />
    {!arm ? <p>{copy('خروجی این گزینه هنوز وارد نشده است.')}</p> : <>
      <section><h2>{copy('رویکرد طراحی')}</h2><p className="comparison-design" dir="auto">{arm.design || copy('توضیح طراحی در این خروجی ثبت نشده است.')}</p></section>
      {!!arm.needs.length && <details><summary>{copy('نیازهای محصول در طرح')}</summary><ul>{arm.needs.map((need, i) => <li key={i}>{need}</li>)}</ul></details>}
      <section><h2>{copy('محصولات انتخاب‌شده')} <small>{arm.products.length}</small></h2>
        {!arm.products.length && <p>{copy('محصول انتخاب‌شده‌ای در این فایل ثبت نشده است؛ این لزوماً به معنی نبود محصول مناسب نیست.')}</p>}
        <div className="comparison-products">{arm.products.map((product, i) => <article key={i}>
          <Photo src={product.image} alt={product.name} /><div><span>{product.need}</span><h3>{product.name}</h3>
            {product.variant && <p>{product.variant}</p>}<p>{display(product.priceToman, copy('تومان'))}</p><p>{product.reason}</p></div>
        </article>)}</div>
      </section>
      {revealed && <section className="comparison-performance"><h2>{copy('منبع، هزینه و زمان')}</h2>
        <p dir="auto">{arm.source || copy('منبع نامشخص')} · {arm.model || copy('مدل ثبت نشده')}</p>
        <dl><div><dt>{copy('جمع هزینهٔ ثبت‌شده')}</dt><dd>{display(arm.cost.knownUsd, 'USD')}</dd></div>
          <div><dt>{copy('تحلیل و طراحی')}</dt><dd>{display(arm.cost.textUsd, 'USD')}</dd></div><div><dt>{copy('تولید تصویر')}</dt><dd>{display(arm.cost.imageUsd, 'USD')}</dd></div>
          <div><dt>{copy('زمان پردازش')}</dt><dd>{display(arm.timing.elapsedMs == null ? null : arm.timing.elapsedMs / 1000, copy('ثانیه'))}</dd></div>
          <div><dt>{copy('فراخوانی‌های ثبت‌شده')}</dt><dd>{display(arm.timing.calls, '')}</dd></div></dl>
        {!arm.cost.complete && <p>{copy('هزینه ناقص یا نامشخص است؛ مبلغ ثبت‌نشده صفر محسوب نمی‌شود.')}</p>}
        <p>{copy(arm.timing.scope === 'session' ? 'هزینه و زمان مربوط به کل جلسه‌اند؛ ممکن است چند درخواست یا تلاش را شامل شوند.' : 'دامنهٔ زمان و هزینه در این فایل کامل مشخص نشده است.')}</p>
        <details><summary>{copy('داده و پرامپت کامل برای بررسی')}</summary><p><bdi>{arm.sessionId} / {arm.versionId}</bdi></p><pre dir="auto">{arm.prompt || copy('پرامپت در این فایل ثبت نشده است.')}</pre><pre dir="auto">{JSON.stringify(arm.document, null, 2)}</pre></details>
      </section>}
    </>}
  </article>;
}

export default function StudioComparePage() {
  const { siteText: copy, siteDirection } = useSiteTranslation();
  const { user } = useAuth();
  const owner = String(user?.id || 'offline');
  const [cases, setCases] = useState<ComparisonCase[]>([]);
  const [selected, setSelected] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [persisted, setPersisted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sessionInput, setSessionInput] = useState('');
  const [target, setTarget] = useState<ArmKey>('A');
  const generation = useRef(0);
  const current = cases.find(item => item.id === selected) || cases[0];
  useEffect(() => {
    let active = true; generation.current += 1; setReady(false); setCases([]); setSelected('');
    void loadWorkspace(owner).then(saved => { if (active) { const items = saved || [newCase()]; setCases(items); setSelected(items[0].id); setReady(true); } })
      .catch(() => { if (active) { const item = newCase(); setCases([item]); setSelected(item.id); setReady(true); setMessage(copy('ذخیرهٔ مرورگر در دسترس نیست؛ خروجی JSON را دانلود کن.')); } });
    return () => { active = false; generation.current += 1; };
    // Account changes must discard the prior account's in-memory photos/votes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);
  useEffect(() => {
    if (!ready || !cases.length) return;
    setPersisted(false); let active = true;
    const timer = window.setTimeout(() => { void saveWorkspace(owner, cases).then(() => { if (active) setPersisted(true); })
      .catch(() => { if (active) setMessage(copy('ذخیرهٔ مرورگر انجام نشد؛ خروجی JSON را دانلود کن.')); }); }, 500);
    return () => { active = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, ready, cases]);
  const update = (change: (item: ComparisonCase) => ComparisonCase) => setCases(items => items.map(item => item.id === current?.id ? change(item) : item));
  const perform = async (work: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await work(); } catch { setMessage(copy('فایل یا جلسه خوانده نشد. فرمت خروجی و دسترسی را بررسی کن.')); } finally { setBusy(false); }
  };
  const importJson = (event: ChangeEvent<HTMLInputElement>, workspace = false) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const key = target, id = current?.id, stamp = generation.current;
    void perform(async () => {
      if (file.size > MAX_FILE_BYTES) throw new Error('file_too_large');
      const raw: unknown = JSON.parse(await file.text());
      if (stamp !== generation.current) return;
      if (workspace) { const parsed = parseCases(raw); generation.current += 1; setCases(parsed); setSelected(parsed[0].id); }
      else { const arm = parseArm(raw); setCases(items => items.map(item => item.id === id ? replaceArm(item, key, arm) : item)); }
    });
  };
  const photo = (event: ChangeEvent<HTMLInputElement>, key?: ArmKey) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const id = current?.id, stamp = generation.current;
    void perform(async () => { const src = await readPhoto(file); if (stamp !== generation.current) return;
      setCases(items => items.map(item => item.id !== id ? item : key && item.arms[key]
        ? replaceArm(item, key, { ...item.arms[key]!, resultImage: imageSource(src) }) : { ...item, originalImage: src, votes: {} }));
    });
  };
  const renderFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); event.target.value = ''; if (!files.length) return;
    const key = target, id = current?.id, stamp = generation.current;
    void perform(async () => {
      const arm = await importRenderFiles(files);
      if (stamp !== generation.current) return;
      setCases(items => items.map(item => item.id === id ? replaceArm(item, key, arm) : item));
    });
  };
  const readSession = () => {
    const id = current?.id, key = target, stamp = generation.current;
    void perform(async () => {
      const sessionId = localSessionId(sessionInput);
      const [session, diagnostics, performance] = await Promise.allSettled([loadChatSession(sessionId), loadSessionDiagnostics(sessionId), loadStudioPerformance(sessionId)]);
      if (session.status !== 'fulfilled' || !session.value.success || !session.value.data) throw new Error('session');
      const arm = fromSession(session.value.data as SessionPayload,
        diagnostics.status === 'fulfilled' && diagnostics.value.success ? diagnostics.value.data : undefined,
        performance.status === 'fulfilled' && performance.value.success ? performance.value.data : undefined, 'لوکال');
      if (stamp !== generation.current) return;
      setCases(items => items.map(item => item.id === id ? replaceArm(item, key, arm) : item));
    });
  };
  const inputMismatch = current && Object.values(current.arms).some(arm => arm?.originalImage && current.originalImage && arm.originalImage !== current.originalImage);
  return <div className="studio-comparison-page" dir={siteDirection()}><Header /><main>
    <header className="comparison-page-heading"><div><p>HOMA / R&D</p><h1>{copy('مقایسهٔ دو مسیر طراحی')}</h1><p>{copy('یک فضا، دو خروجی؛ طراحی، محصول و تصویر را جدا ارزیابی کن.')}</p></div><Link to="/studio">{copy('بازگشت به استودیو')}</Link></header>
    <div className="comparison-notice">{copy('این صفحه مدل را اجرا نمی‌کند. فقط خروجی‌های ذخیره‌شده را می‌خواند؛ فایل‌ها و رأی‌ها در همین مرورگر می‌مانند.')}</div>
    <p className="comparison-media-note">{copy('نشانی بعضی تصاویرِ جلسه موقت است؛ برای گزارش ماندگار، تصاویر را از بستهٔ R&D یا فایل عکس وارد کن.')}</p>
    <nav className="comparison-workspace" aria-label={copy('مدیریت آزمون')}>
      <label>{copy('کیس مقایسه')}<select value={current?.id || ''} disabled={busy || !ready} onChange={event => setSelected(event.target.value)}>{cases.map((item, index) => <option key={item.id} value={item.id}>{item.title || `${copy('کیس')} ${index + 1}`}</option>)}</select></label>
      <Button variant="outline" disabled={busy || !ready || cases.length >= 50} onClick={() => { const item = newCase(); setCases(items => [...items, item]); setSelected(item.id); }}>{copy('کیس جدید')}</Button>
      <Button variant="outline" disabled={!ready || busy} onClick={() => download({ format, cases }, 'homa-comparison.json')}>{copy('دانلود گزارش و رأی‌ها')}</Button>
      <Button variant="outline" disabled={!ready || busy} onClick={() => download({ format, cases: cases.map(item => ({ ...item, order: newCase().order, revealed: false, votes: {} })) }, 'homa-comparison-for-review.json')}>{copy('دانلود نسخهٔ بدون رأی برای ارزیاب')}</Button>
      <label className="comparison-file-button">{copy('بازکردن گزارش مقایسه')}<input type="file" accept="application/json,.json" disabled={!ready || busy} onChange={event => importJson(event, true)} /></label>
      <span role="status">{copy(persisted ? 'در مرورگر ذخیره شد' : 'در حال آماده‌سازی یا ذخیره…')}</span>
    </nav>
    {message && <p role="alert" className="comparison-alert">{message}</p>}
    {current && <>
      <section className="comparison-case-intake"><div><label>{copy('عنوان کیس')}<input maxLength={120} value={current.title} onChange={event => update(item => ({ ...item, title: event.target.value }))} /></label>
        <label>{copy('درخواست یکسان کاربر برای هر دو نسخه')}<textarea rows={3} maxLength={4000} value={current.brief} onChange={event => update(item => ({ ...item, brief: event.target.value, votes: {} }))} /></label>
        <label className="comparison-file-button">{copy('انتخاب عکس اصلی')}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => photo(event)} /></label></div>
        <figure><Photo src={current.originalImage} alt={copy('عکس اصلی مشترک')} /><figcaption>{copy('عکس اصلی مشترک')}</figcaption></figure>
      </section>
      <details className="comparison-setup"><summary>{copy('واردکردن خروجی دو نسخه')}</summary>
        <p>{copy('خروجی A و B را جدا وارد کن؛ ترتیب نمایش گزینه‌ها تصادفی و ثابت است. برای سرورِ خارج از دسترس، فایل JSON ذخیره‌شده را وارد کن.')}</p>
        <div className="comparison-import-controls"><label>{copy('ورودی مقصد')}<select value={target} disabled={busy} onChange={event => setTarget(event.target.value as ArmKey)}><option value="A">A</option><option value="B">B</option></select></label>
          <label className="comparison-file-button">{copy('ورود JSON نسخه')}<input type="file" disabled={busy} accept="application/json,.json" onChange={event => importJson(event)} /></label>
          <label>{copy('لینک یا شناسهٔ جلسهٔ لوکال')}<input value={sessionInput} onChange={event => setSessionInput(event.target.value)} /></label>
          <Button variant="outline" disabled={busy || !sessionInput.trim()} onClick={readSession}>{copy('خواندن خروجی ذخیره‌شده')}</Button>
        </div>
        <label className="comparison-file-button">{copy('ورود فایل‌های بستهٔ R&D استخراج‌شده')}<input type="file" multiple accept=".json,.txt,.html,image/png,image/jpeg,image/webp" disabled={busy} onChange={renderFiles} /></label>
        <p>{copy('برای بستهٔ R&D، ابتدا ZIP را استخراج کن؛ سپس request.json و همهٔ تصاویر شماره‌دار را با هم انتخاب کن. تصویر تولیدشده در ChatGPT را جدا به همان نسخه اضافه کن.')}</p>
        <p>{copy('فرمت‌های قابل ورود: خروجی نسخه از همین صفحه، JSON جلسه، یا JSON پنل عملکرد و پرامپت. برای حفظ همهٔ اطلاعات، خروجی نسخه از همین صفحه را ترجیح بده.')}</p>
        <Button variant="outline" onClick={() => download({ format: 'homa-studio-arm-v1', arm: fromSession({ session_id: '', status: 'active', title: '', turns: [] }) }, 'homa-arm-template.json')}>{copy('دانلود قالب خالی نسخه')}</Button>
        {(['A', 'B'] as ArmKey[]).map(key => <div key={key} className="comparison-setup-arm"><b>{key}</b><span>{copy(current.arms[key] ? 'وارد شده' : 'وارد نشده')}</span>
          {current.arms[key] && <><label>{copy('نام منبع، مدل یا نسخه برای پیگیری')}<input value={current.arms[key]!.source} onChange={event => update(item => replaceArm(item, key, { ...item.arms[key]!, source: event.target.value }))} /></label>
            <label className="comparison-file-button">{copy('افزودن تصویر رندر این نسخه')}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={event => photo(event, key)} /></label>
            <Button variant="outline" onClick={() => download({ format: 'homa-studio-arm-v1', arm: current.arms[key] }, `homa-arm-${key}.json`)}>{copy('دانلود خروجی نسخه')}</Button></>}
        </div>)}
        <p>{copy('با تغییر ورودی، تصویر یا درخواست، رأی‌های همان کیس پاک می‌شوند تا ارزیابی قبلی به خروجی تازه نسبت داده نشود.')}</p>
      </details>
      {inputMismatch && <p role="alert" className="comparison-alert">{copy('عکس ورودی ثبت‌شده برای دو نسخه یکسان نیست یا نشانی متفاوت دارد؛ قبل از نتیجه‌گیری، یکسان‌بودن عکس‌ها را بررسی کن.')}</p>}
      <div className="comparison-blind-controls"><p>{copy(current.revealed ? 'منابع نمایش داده شده‌اند؛ رأی‌های بعدی کور محسوب نمی‌شوند.' : 'منابع و هزینه‌ها پنهان‌اند تا قضاوت اولیه تحت تأثیر نسخه قرار نگیرد.')}</p>
        {!current.revealed && <Button variant="outline" onClick={() => update(item => ({ ...item, revealed: true }))}>{copy('نمایش منابع، هزینه و زمان')}</Button>}</div>
      <section className="comparison-columns" aria-label={copy('خروجی‌های کنار هم')}>{current.order.map((key, index) => <ArmPanel key={`${current.id}-${key}`} arm={current.arms[key]} index={index} revealed={current.revealed} />)}</section>
      <section className="comparison-votes"><h2>{copy('ارزیابی این کیس')}</h2><p>{copy('خروجی ناموفق را حذف نکن. اگر داده کافی نیست، همان را ثبت کن. تعداد بیشتر محصول به‌تنهایی نشانهٔ کیفیت نیست.')}</p>
        <div>{dimensions.map(dimension => <VoteForm key={`${current.id}-${dimension}`} item={current} dimension={dimension} onSave={(choice, note, judge) => update(item => vote(item, dimension, choice, note, judge))} />)}</div>
      </section>
    </>}
    <section className="comparison-summary"><h2>{copy('جمع‌بندی کیس‌های ثبت‌شده')}</h2><p>{copy('این شمارش رأی‌های ثبت‌شده است؛ برتری آماری یا نتیجهٔ قطعی دربارهٔ کل سیستم نیست. A و B همان ورودی‌های فایل‌اند، نه شمارهٔ نمایشی گزینه‌ها.')}</p>
      <div className="comparison-table-wrap"><table><thead><tr><th>{copy('معیار')}</th><th>A</th><th>B</th><th>{copy('برابر')}</th><th>{copy('هیچ‌کدام')}</th><th>{copy('ارزیابی نشده')}</th></tr></thead><tbody>{dimensions.map(dimension => { const count = totals(cases, dimension); return <tr key={dimension}><th>{copy(dimensionLabels[dimension])}</th>{Object.values(count).map((value, i) => <td key={i}>{value}</td>)}</tr>; })}</tbody></table></div>
    </section>
  </main></div>;
}
