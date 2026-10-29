import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { useIntakeFlow } from './useIntakeFlow';
import type { HomaIntakePayload, RoomType } from './intakeTypes';
import './home-intake.css';

export function HomeStudioIntake({ onStartAnalysis }: { onStartAnalysis: (payload: HomaIntakePayload) => void }) {
  const { siteText: copy, siteDirection } = useSiteTranslation();
  const room = useIntakeFlow(), inspiration = useIntakeFlow();
  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState<RoomType>('living_room');
  const [submitting, setSubmitting] = useState(false);
  const localOutput = import.meta.env.DEV && import.meta.env.MODE === 'studio-local';
  const [imageOutputMode, setImageOutputMode] = useState<'export' | 'api'>('export');
  const gallery = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null), reference = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(false);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const busy = room.preparing || inspiration.preparing || submitting;
  const pick = (file?: File, source: 'gallery' | 'camera' = 'gallery') => { if (file && !busy) void room.pickImage(file, source); };
  const titles = ['', 'از کدام فضا شروع کنیم؟', room.image ? 'این عکسِ فضای توست.' : 'فضایت را به هما نشان بده.', 'خودت به چه تغییراتی فکر کردی که فکر می‌کنی فضاتو بهتر کنه؟', 'عکسِ فضایی که دوستش داری داری؟'];
  const start = () => {
    if (busy || submitted.current || !room.image) return;
    submitted.current = true; setSubmitting(true);
    try { onStartAnalysis({ image: room.image, roomType, goals: [], userNote: room.note || undefined,
      inspirationImage: inspiration.image || undefined, ...(localOutput ? { imageOutputMode } : {}), prefsUpdate: { room_type: roomType as 'bedroom' | 'living_room' }, createdAt: new Date().toISOString() }); }
    catch (error) { submitted.current = false; setSubmitting(false); throw error; }
  };
  const sample = roomType === 'bedroom' ? '/images/studio/preset-bright-bedroom.webp' : '/images/studio/example-good.webp';
  return <div className="home-studio-intake" dir={siteDirection()}><Header /><main>
    <nav aria-label={copy('مراحل آماده‌سازی')}><span>HOMA / STUDIO</span><span>{copy('گام')} {step} / 4</span></nav>
    <section key={step} className="home-intake-step">
      <h1 ref={heading} tabIndex={-1}>{copy(titles[step])}</h1>
      {step === 1 && <><p>{copy('هر بار یک فضا؛ طراحی از عکس واقعی خانهٔ تو شروع می‌شود.')}</p><div className="home-intake-rooms">{([{ id: 'living_room', title: 'پذیرایی و نشیمن', photo: '/images/studio/preset-warm-living.webp' }, { id: 'bedroom', title: 'اتاق خواب', photo: '/images/studio/preset-bright-bedroom.webp' }] as const).map(option => <button key={option.id} type="button" onClick={() => { setRoomType(option.id); setStep(2); }}><img src={option.photo} alt="" /><b>{copy(option.title)}</b></button>)}</div></>}
      {step === 2 && <>{room.image ? <><img className="home-intake-preview" src={room.image.dataUrl} alt={copy('عکس واقعی فضای شما')} /><button type="button" className="home-intake-text" disabled={busy} onClick={() => gallery.current?.click()}>{copy('تعویض عکس')}</button>{room.imageTooSmall && <p role="status">{copy('عکس کوچک است؛ عکس واضح‌تر به تشخیص جزئیات کمک می‌کند.')}</p>}</> : <><p>{copy('بهتر است بیشتر فضا و وسایل اصلی داخل کادر باشند؛ بدون فیلتر و با نور کافی.')}</p><div className="home-intake-guide">{[false, true].map(bad => <figure key={String(bad)}><img src={sample} className={bad ? 'is-closeup' : ''} alt={copy(bad ? 'نمونهٔ کادر نزدیک با فضای ناکافی' : 'نمونهٔ کادر باز از اتاق')} /><figcaption>{copy(bad ? 'عکس بد · کادر خیلی نزدیک' : 'عکس خوب · نمای باز فضا')}</figcaption></figure>)}</div><button type="button" className="studio-onboarding-primary" disabled={busy} onClick={() => gallery.current?.click()}><ImagePlus size={18} />{copy(room.preparing ? 'در حال آماده‌سازی عکس…' : 'انتخاب از گالری')}</button><button type="button" className="home-intake-text" disabled={busy} onClick={() => camera.current?.click()}><Camera size={17} />{copy('گرفتن عکس با دوربین')}</button></>}</>}
      {step === 3 && <><p>{copy('مثلاً می‌خوای چیدمان مبل‌ها بهتر بشه، پرده رو عوض کنی یا اتاقت روشن‌تر بشه؟ اگر ایده‌ای نداری، هما خودش بررسی می‌کنه.')}</p><label htmlFor="home-intake-note">{copy('خواستهٔ تو · اختیاری')}</label><textarea id="home-intake-note" value={room.note} maxLength={2000} onChange={event => room.setNote(event.target.value)} placeholder={copy('مثلاً: پرده روشن‌تر باشد…')} /><button type="button" className="home-intake-text" onClick={() => { room.setNote(''); setStep(4); }}>{copy('فعلاً نظری ندارم')}</button></>}
      {step === 4 && <><p>{copy('اگر از سبک یا فضای موردعلاقه‌ات عکس داری، اینجا بفرست. اگر نه، هما با توجه به فضای خودت مسیر طراحی را پیشنهاد می‌دهد.')}</p>{inspiration.image ? <><img className="home-intake-preview home-intake-reference" src={inspiration.image.dataUrl} alt={copy('عکس الهام؛ فضای واقعی شما نیست')} /><button className="home-intake-text" type="button" onClick={() => reference.current?.click()} disabled={busy}>{copy('تعویض عکس الهام')}</button><button className="home-intake-text" type="button" onClick={inspiration.removeImage} disabled={busy}>{copy('بدون عکس الهام ادامه می‌دهم')}</button></> : <button className="home-intake-reference-upload" type="button" disabled={busy} onClick={() => reference.current?.click()}><ImagePlus size={25} />{copy(inspiration.preparing ? 'در حال آماده‌سازی…' : 'افزودن عکس الهام · اختیاری')}</button>}</>}
      {step === 4 && localOutput && <details><summary>{copy('تنظیمات تست لوکال')}</summary><label>{copy('خروجی تصویر')}<select value={imageOutputMode} onChange={e => setImageOutputMode(e.target.value as 'export' | 'api')}><option value="export">{copy('بستهٔ R&D بدون تولید تصویر')}</option><option value="api">{copy('تولید تصویر با API · دارای هزینه')}</option></select></label></details>}
      {(room.error || inspiration.error) && <p role="alert">{copy('عکس باز نشد؛ یک تصویر معتبر با حجم حداکثر ۸ مگابایت انتخاب کن.')}</p>}
    </section>
    <footer><button type="button" className="home-intake-text" disabled={step === 1 || busy} onClick={() => setStep(value => value - 1)}><ArrowRight size={16} />{copy('قبلی')}</button>{step > 1 && <button type="button" className="studio-onboarding-primary" disabled={busy || step === 2 && !room.image} onClick={step === 4 ? start : () => setStep(value => value + 1)}>{copy(step === 4 ? 'شروع بررسی فضا' : step === 2 ? 'تأیید عکس' : 'ادامه')}</button>}</footer>
    <input ref={gallery} className="sr-only" type="file" aria-label={copy('انتخاب عکس اتاق')} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={busy} onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
    <input ref={camera} className="sr-only" type="file" aria-label={copy('عکس اتاق با دوربین')} accept="image/*" capture="environment" disabled={busy} onChange={e => { pick(e.target.files?.[0], 'camera'); e.target.value = ''; }} />
    <input ref={reference} className="sr-only" type="file" aria-label={copy('انتخاب عکس الهام')} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void inspiration.pickImage(file, 'gallery'); e.target.value = ''; }} />
  </main></div>;
}
