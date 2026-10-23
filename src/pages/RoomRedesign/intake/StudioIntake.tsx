import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, Check, History, ImagePlus, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { useIntakeFlow } from './useIntakeFlow';
import type { HomaIntakePayload } from './intakeTypes';
import { ROOMS, MOODS, ROOM_STYLE_HINTS, HOME_GOALS, HOST_GOALS, initialChoices, budgetAmount, buildOnboardingPayload } from './studioOnboarding';
import './studio-onboarding.css';
import { StylePhoto } from './StylePhoto';

const STEPS = ['برای چه فضایی؟', 'انتخاب اتاق', 'عکس فضا', 'اولویت شما', 'حال‌وهوای دلخواه', 'حدود تغییر', 'مرور و شروع'];
/** One decision per screen. Only final confirmation hands off to AI. */
export function StudioIntake({ onStartAnalysis, host = false }: { onStartAnalysis: (payload: HomaIntakePayload) => void; host?: boolean }) {
  const { siteText: copy, siteDirection, siteLocale } = useSiteTranslation();
  const location = useLocation();
  const flow = useIntakeFlow();
  const [choices, setChoices] = useState(() => initialChoices(location.search, host));
  const [step, setStep] = useState(() => {
    const initial = initialChoices(location.search, host);
    return initial.room !== 'not_sure' ? 2 : host || new URLSearchParams(location.search).has('audience') ? 1 : 0;
  });
  const [dragging, setDragging] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const gallery = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const submitting = useRef(false);
  useEffect(() => { if (previousStep.current !== step) { heading.current?.focus(); previousStep.current = step; } }, [step]);
  const update = (part: Partial<typeof choices>) => setChoices(value => ({ ...value, ...part }));
  const room = ROOMS.find(item => item.id === choices.room);
  const mood = MOODS.find(item => item.id === choices.mood);
  const goalOptions = choices.audience === 'host' ? HOST_GOALS : HOME_GOALS;
  const titles = ['برای خانهٔ خودت، یا مهمان‌هایت؟', 'از کدام فضا شروع کنیم؟', 'همین فضا را به ما نشان بده.', 'چه چیزی برایت مهم‌تر است؟', 'دوست داری چه حسی داشته باشد؟', 'چه چیزهایی را در نظر بگیریم؟', 'طرح از همین‌جا شروع می‌شود.'];
  const hints = ['مسیر را با توجه به استفادهٔ واقعی از فضا تنظیم می‌کنیم.', 'هر بار یک فضا و یک عکس؛ برای اتاق بعدی یک طراحی جدا بساز.', 'عکس واقعی و بدون فیلتر کافی است؛ لازم نیست خانه را از قبل مرتب کنی.', 'می‌توانی چند مورد را انتخاب کنی، یا تصمیم را به طراح بسپاری.', 'اسم سبک‌ها را لازم نیست بدانی؛ ببین کدام تصویر به سلیقه‌ات نزدیک‌تر است.', 'این انتخاب‌ها به طراح کمک می‌کنند تغییرهای قابل‌اجراتری پیشنهاد دهد.', 'انتخاب‌هایت را مرور کن. تا زدن دکمهٔ شروع، عکس به سرویس طراحی فرستاده نمی‌شود.'];
  const pick = (file: File | undefined, source: 'gallery' | 'camera') => { if (file && !flow.preparing) void flow.pickImage(file, source); };
  const next = () => {
    if (flow.preparing || step === 2 && !flow.image) return;
    if (step === 5 && choices.budgetMode === 'limit' && budgetAmount(choices.budget) === null) { setBudgetError(true); return; }
    setBudgetError(false); setStep(value => Math.min(6, value + 1));
  };
  const start = () => {
    if (submitting.current || flow.preparing) return;
    const payload = flow.buildPayload(); if (!payload) return;
    if (choices.budgetMode === 'limit' && budgetAmount(choices.budget) === null) { setStep(5); setBudgetError(true); return; }
    submitting.current = true;
    try { onStartAnalysis(buildOnboardingPayload(payload, choices)); } finally { queueMicrotask(() => { submitting.current = false; }); }
  };
  return <div className="studio-onboarding" dir={siteDirection()}><Header /><main>
    <div className="studio-onboarding-top"><Link to="/">HOMA <span>STUDIO</span></Link><Link to="/studio/projects"><History size={15} />{copy('طراحی‌های من')}</Link></div>
    <div className="studio-onboarding-layout">
      <aside className="studio-onboarding-visual">
        {flow.image ? <img className="studio-original-photo" src={flow.image.dataUrl} alt={copy('عکس فضای شما')} /> : room ? <StylePhoto row={room.row} col={mood?.col || 0} label={copy(room.label)} /> : <img src="/images/studio/preset-warm-living.webp" alt={copy('الهام برای یک خانهٔ گرم و آرام')} />}
        <div className="studio-onboarding-caption"><span>{copy(flow.image ? 'فضای شما، نقطهٔ شروع ما' : 'یک نگاه تازه به فضای آشنا')}</span><p>{copy(flow.image ? 'ابعاد واقعی و وسایلی که می‌خواهی بمانند، راهنمای طراحی‌اند.' : 'با چند انتخاب ساده، سلیقه‌ات را به طراح نشان بده.')}</p></div>
        {flow.image && <button className="studio-change-photo" type="button" disabled={flow.preparing} onClick={() => gallery.current?.click()}><ImagePlus size={16} />{copy('تعویض عکس')}</button>}
      </aside>
      <section className="studio-onboarding-body">
        <nav aria-label={copy('مراحل آماده‌سازی طراحی')} className="studio-onboarding-progress"><span>{copy('گام')} {step + 1} / {STEPS.length}</span><span>{copy(STEPS[step])}</span><div role="progressbar" aria-label={copy('پیشرفت آماده‌سازی')} aria-valuemin={0} aria-valuemax={7} aria-valuenow={step + 1}>{STEPS.map((label, index) => <span key={label} data-complete={index <= step} />)}</div></nav>
        {choices.audience === 'host' && <span className="studio-host-label">{copy('استودیو برای میزبان‌ها')}</span>}
        <h1 ref={heading} tabIndex={-1}>{copy(titles[step])}</h1><p className="studio-onboarding-hint">{copy(hints[step])}</p>
        <div className="studio-onboarding-question" key={step}>
          {step === 0 && <div className="studio-audience-options">
            {([{ id: 'home', title: 'خانهٔ من', hint: 'برای زندگی روزمره، با سلیقه و وسایل خودم' }, { id: 'host', title: 'اقامتگاه من', hint: 'برای راحتی مهمان و بهتر دیده‌شدن فضا در آگهی' }] as const).map((option, index) => <button key={option.id} type="button" aria-pressed={choices.audience === option.id} onClick={() => update({ audience: option.id, goals: [] })}><span>0{index + 1}</span><div><h2>{copy(option.title)}</h2><p>{copy(option.hint)}</p></div><Check size={18} /></button>)}
          </div>}
          {step === 1 && <><div className="studio-room-options">{ROOMS.map(option => <button type="button" key={option.id} aria-pressed={choices.room === option.id} onClick={() => update({ room: option.id })}><StylePhoto row={option.row} col={0} label={copy(option.label)} /><span><b>{copy(option.label)}</b><small>{copy(option.hint)}</small></span>{choices.room === option.id && <Check size={18} />}</button>)}</div><button className="studio-inline-option" type="button" aria-pressed={choices.room === 'not_sure'} onClick={() => update({ room: 'not_sure' })}>{copy('نوع فضا را طراح از روی عکس تشخیص دهد')}</button></>}
          {step === 2 && <><div className="studio-onboarding-upload" data-dragging={dragging} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); pick(event.dataTransfer.files[0], 'gallery'); }}>
            {flow.image ? <Check size={28} strokeWidth={1.2} /> : <ImagePlus size={32} strokeWidth={1.2} />}<h2>{copy(flow.image ? 'عکس آماده است.' : 'عکس را اینجا رها کن')}</h2><p>{copy(flow.image ? 'می‌توانی با همین عکس ادامه بدهی یا آن را عوض کنی.' : 'یا یک عکس از گالری انتخاب کن.')}</p>
            <button type="button" className="studio-onboarding-primary" disabled={flow.preparing} onClick={() => gallery.current?.click()}>{flow.preparing ? <Loader2 className="studio-spinner" size={17} /> : <ImagePlus size={17} />}{copy(flow.preparing ? 'در حال آماده‌سازی عکس…' : flow.image ? 'انتخاب عکس دیگر' : 'انتخاب عکس')}</button>
            <button type="button" className="studio-inline-option" disabled={flow.preparing} onClick={() => camera.current?.click()}><Camera size={16} />{copy('با دوربین عکس می‌گیرم')}</button><small>{copy('JPG، PNG، WebP یا HEIC · حداکثر ۸ مگابایت')}</small>
          </div><details className="studio-onboarding-tips"><summary>{copy('چه عکسی نتیجهٔ بهتری می‌دهد؟')}</summary><div><img src="/images/studio/example-good.webp" alt={copy('نمونهٔ عکس با نور و دید کافی')} /><ul><li>{copy('از گوشهٔ اتاق و هم‌ارتفاع چشم عکس بگیر.')}</li><li>{copy('پنجره، کف و وسایل اصلی در کادر باشند.')}</li><li>{copy('نور روز و دوربین معمولی؛ بدون حالت پانوراما یا فیلتر.')}</li></ul></div></details>{flow.imageTooSmall && <p className="studio-onboarding-warning">{copy('عکس کوچک است؛ می‌توانی ادامه بدهی، اما عکس واضح‌تر جزئیات بیشتری نشان می‌دهد.')}</p>}</>}
          {step === 3 && <div className="studio-goal-options">{goalOptions.map(option => <button type="button" key={option.id} aria-pressed={choices.goals.includes(option.id)} onClick={() => update({ goals: choices.goals.includes(option.id) ? choices.goals.filter(id => id !== option.id) : [...choices.goals, option.id] })}><div><b>{copy(option.label)}</b><small>{copy(option.hint)}</small></div><span className="studio-check-box">{choices.goals.includes(option.id) && <Check size={14} />}</span></button>)}<p className="studio-subtle">{copy('انتخاب نکردن هم اشکالی ندارد؛ طراح پیشنهاد می‌دهد.')}</p></div>}
          {step === 4 && <><div className="studio-style-room-switch"><span>{copy('نمونه‌ها برای')} {copy(room?.label || 'پذیرایی و نشیمن')}</span><button type="button" onClick={() => setStep(1)}>{copy('تغییر فضا')}</button></div><div className="studio-mood-options">{MOODS.map((option, index) => <button key={option.id} type="button" aria-pressed={choices.mood === option.id} onClick={() => update({ mood: choices.mood === option.id ? null : option.id })}><StylePhoto row={room?.row ?? 1} col={option.col} label={copy(option.name) + ' — ' + copy(room?.label || 'پذیرایی و نشیمن')} /><span><b>{copy(option.name)}</b><small>{copy(ROOM_STYLE_HINTS[room?.id || 'living_room'][index])}</small></span>{choices.mood === option.id && <i><Check size={16} /></i>}</button>)}</div>
            <button type="button" className="studio-inline-option" aria-pressed={choices.mood === null} onClick={() => update({ mood: null })}>{copy('هنوز مطمئن نیستم؛ پیشنهاد طراح را می‌خواهم')}</button><p className="studio-subtle">{copy('تصاویر فقط برای شناخت سلیقه‌اند؛ طرح نهایی از روی عکس و شرایط فضای شما ساخته می‌شود.')}</p></>}
          {step === 5 && <div className="studio-constraints"><fieldset><legend>{copy('چقدر دست طراح باز باشد؟')}</legend><div className="studio-segment-options"><button type="button" aria-pressed={choices.scope === 'refresh'} onClick={() => update({ scope: 'refresh' })}>{copy('تازه‌سازی با حفظ مبلمان اصلی')}</button><button type="button" aria-pressed={choices.scope === 'open'} onClick={() => update({ scope: 'open' })}>{copy('برای تغییرهای بیشتر هم باز هستم')}</button></div></fieldset>
            <label htmlFor="studio-preserved">{copy('چه چیزهایی حتماً بمانند؟')} <small>{copy('اختیاری؛ مثلاً مبل، تخت یا فرش')}</small><input id="studio-preserved" maxLength={500} value={choices.preserved} placeholder={copy('نام وسایل را با ویرگول جدا کن')} onChange={event => update({ preserved: event.target.value })} /></label>
            <fieldset><legend>{copy('بودجهٔ خرید محصولات')}</legend><div className="studio-budget-options">{([{ id: 'unknown', label: 'فعلاً مشخص نیست' }, { id: 'none', label: 'فعلاً خرید نمی‌کنم' }, { id: 'limit', label: 'سقف بودجه دارم' }] as const).map(option => <button type="button" key={option.id} aria-pressed={choices.budgetMode === option.id} onClick={() => { update({ budgetMode: option.id }); setBudgetError(false); }}>{copy(option.label)}</button>)}</div></fieldset>
            {choices.budgetMode === 'limit' && <label htmlFor="studio-budget">{copy('حداکثر مجموع خرید، به تومان')}<input id="studio-budget" inputMode="numeric" aria-invalid={budgetError} aria-describedby={budgetError ? 'studio-budget-error' : undefined} value={choices.budget} maxLength={20} placeholder={copy('مثلاً ۲۰٬۰۰۰٬۰۰۰')} onChange={event => { update({ budget: event.target.value }); setBudgetError(false); }} />{budgetError && <small role="alert" id="studio-budget-error">{copy('یک مبلغ معتبر و بیشتر از صفر وارد کن.')}</small>}</label>}
            <p className="studio-subtle">{copy('این مبلغ سقف خرید محصول است؛ هزینهٔ اجرای کار یا دستمزد را شامل نمی‌شود.')}</p></div>}
          {step === 6 && <><dl className="studio-onboarding-summary">{[
            { label: 'کاربری', value: choices.audience === 'host' ? 'اقامتگاه و میزبانی' : 'خانهٔ شخصی', target: 0 },
            { label: 'فضا', value: room?.label || 'تشخیص از روی عکس', target: 1 },
            { label: 'اولویت', value: goalOptions.filter(option => choices.goals.includes(option.id)).map(option => copy(option.label)).join('، ') || copy('پیشنهاد طراح'), target: 3 },
            { label: 'سبک', value: mood?.name || 'پیشنهاد طراح', target: 4 },
            { label: 'بودجه', value: choices.budgetMode === 'unknown' ? copy('فعلاً مشخص نیست') : choices.budgetMode === 'none' ? copy('فعلاً خرید نمی‌کنم') : `${budgetAmount(choices.budget)?.toLocaleString(siteLocale())} ${copy('تومان')}`, target: 5 },
            { label: 'حدود تغییر', value: choices.scope === 'refresh' ? 'تازه‌سازی با حفظ مبلمان اصلی' : 'برای تغییرهای بیشتر هم باز هستم', target: 5 },
            { label: 'وسایل ثابت', value: choices.preserved || copy('موردی مشخص نشده'), target: 5 },
          ].map(row => <div key={row.label}><dt>{copy(row.label)}</dt><dd>{row.label === 'وسایل ثابت' ? row.value : copy(row.value)}</dd><button type="button" onClick={() => setStep(row.target)} aria-label={copy('ویرایش') + ' ' + copy(row.label)}>{copy('ویرایش')}</button></div>)}</dl>
            <label className="studio-final-note" htmlFor="studio-note">{copy('نکتهٔ دیگری برای طراح داری؟')} <small>{copy('اختیاری')}</small><textarea id="studio-note" rows={3} maxLength={2000} value={flow.note} onChange={event => flow.setNote(event.target.value)} placeholder={copy('مثلاً نور شب برایم مهم است یا دیوارها تغییر نکنند.')} /></label><p className="studio-subtle">{copy('در ادامه، طرح و محصولات پیشنهادی را می‌بینی و می‌توانی در گفت‌وگو اصلاحشان کنی. خرید محصول جداگانه است.')}</p></>}
        </div>
        {flow.error && <p className="studio-onboarding-warning" role="alert">{copy('عکس باز نشد. یک فایل تصویری معتبر با حجم حداکثر ۸ مگابایت انتخاب کن.')}</p>}
        <div className="studio-onboarding-actions"><button type="button" className="studio-onboarding-back" disabled={step === 0 || flow.preparing} onClick={() => { setBudgetError(false); setStep(value => value - 1); }}><ArrowRight size={16} />{copy('قبلی')}</button><button type="button" className="studio-onboarding-primary" disabled={flow.preparing || step === 2 && !flow.image} onClick={step === 6 ? start : next}>{copy(step === 6 ? 'شروع طراحی فضای من' : step === 2 ? 'ادامه با این عکس' : 'ادامه')}<ArrowLeft size={17} /></button></div>
        <p className="studio-onboarding-footnote">{copy(step < 6 ? 'قبل از شروع می‌توانی همهٔ انتخاب‌ها را مرور و عوض کنی.' : 'شروع طراحی ممکن است اعتبار حساب مصرف کند. برای شروع، حساب کاربری لازم است.')}</p>
      </section>
    </div>
    <input ref={gallery} className="sr-only" tabIndex={-1} type="file" aria-label={copy('انتخاب عکس از گالری')} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={flow.preparing} onChange={event => { pick(event.target.files?.[0], 'gallery'); event.target.value = ''; }} />
    <input ref={camera} className="sr-only" tabIndex={-1} type="file" aria-label={copy('گرفتن عکس با دوربین')} accept="image/*" capture="environment" disabled={flow.preparing} onChange={event => { pick(event.target.files?.[0], 'camera'); event.target.value = ''; }} />
  </main></div>;
}
