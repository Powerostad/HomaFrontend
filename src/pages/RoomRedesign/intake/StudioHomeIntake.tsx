import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Camera, ImagePlus, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { apiGet } from '@/utils/apiClient';
import { useIntakeFlow } from './useIntakeFlow';
import { initialChoices, buildOnboardingPayload, budgetAmount } from './studioOnboarding';
import type { HomaIntakePayload } from './intakeTypes';
import './studio-home-intake.css';

type Step = 1 | 2 | 3;
type Credit = { gift: boolean; can_start: boolean };
export type StudioSubmission = { accepted: boolean; busy: boolean; error: string | null; retry: () => void };
type Props = {
  introduction?: ReactNode;
  requiresSignIn?: boolean;
  accountId?: string;
  onStartAnalysis?: (payload: HomaIntakePayload) => void;
  submission?: StudioSubmission | null;
  submitting?: boolean;
  onEditSubmission?: () => void;
};

const guideKey = 'homa.studio.photo-guide.seen';
const example = '/images/studio/example-good.webp';
const intents = [
  ['پیشنهاد با هما', 'دوست داری نکته‌ای رو به هما بگی؟'],
  ['چیدمانم مشکل داره', 'کجای فضا برات خوب کار نمی‌کنه؟'],
  ['یه ایده توی ذهنم دارم', 'دوست داری فضا چه حس‌وحالی داشته باشه؟'],
  ['قصد خرید دارم', 'دنبال چه وسیله‌ای هستی؟'],
] as const;
const titles = ['اول فضایی که می‌خوای بهترش کنی رو ببینیم.', 'دوست داری چی توی این فضا بهتر بشه؟', 'آماده‌ایم طراحی فضای تو رو شروع کنیم.'];

export function StudioHomeIntake({ introduction, requiresSignIn, accountId, onStartAnalysis, submission, submitting, onEditSubmission }: Props) {
  const { siteText: copy, siteDirection, siteLocale } = useSiteTranslation();
  const flow = useIntakeFlow();
  const [step, setStep] = useState<Step>(1);
  const [intent, setIntent] = useState(0);
  const [preserved, setPreserved] = useState('');
  const [budget, setBudget] = useState('');
  const [sampleAfter, setSampleAfter] = useState(false);
  const purchaseBudget = intent === 3 && budget.trim() ? budgetAmount(budget) : null;
  const invalidBudget = intent === 3 && !!budget.trim() && !purchaseBudget;
  const requestLines = [
    intent > 0 && copy(intents[intent][0]), flow.note.trim(),
    preserved.trim() && copy('حفظ شود') + ' — ' + preserved.trim(),
    purchaseBudget && copy('سقف خرید (تومان)') + ' — ' + purchaseBudget,
  ].filter(Boolean);
  const [editing, setEditing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideSeen, setGuideSeen] = useState(() => {
    try { return localStorage.getItem(guideKey) === 'yes'; } catch { return false; }
  });
  const [credit, setCredit] = useState<Credit | null>(null);
  const [creditError, setCreditError] = useState(false);
  const [creditAttempt, setCreditAttempt] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const pickButton = useRef<HTMLElement | null>(null);
  const rtl = siteDirection() === 'rtl';
  const Next = rtl ? ArrowLeft : ArrowRight;
  const Back = rtl ? ArrowRight : ArrowLeft;
  const number = new Intl.NumberFormat(siteLocale());

  useEffect(() => {
    if (previousStep.current !== step) {
      heading.current?.focus({ preventScroll: true });
      previousStep.current = step;
    }
  }, [step]);
  useEffect(() => {
    if (step !== 3 || requiresSignIn) return;
    const controller = new AbortController();
    setCredit(null);
    setCreditError(false);
    void apiGet<Credit>('/recommendations/chat/start-credit/', undefined, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (result.success && typeof result.data?.gift === 'boolean' && typeof result.data?.can_start === 'boolean') setCredit(result.data);
      else setCreditError(true);
    });
    return () => controller.abort();
  }, [step, requiresSignIn, accountId, creditAttempt]);

  function openPicker(source: 'gallery' | 'camera') {
    if (flow.preparing) return;
    if (!guideSeen) {
      pickButton.current = document.activeElement as HTMLElement | null;
      setGuideSeen(true);
      try { localStorage.setItem(guideKey, 'yes'); } catch { /* In-memory state still works. */ }
      setGuideOpen(true);
      return;
    }
    (source === 'gallery' ? gallery : camera).current?.click();
  }

  function usePicker(source: 'gallery' | 'camera') {
    setGuideOpen(false);
    (source === 'gallery' ? gallery : camera).current?.click();
  }

  function edit(target: 1 | 2) {
    onEditSubmission?.();
    setEditing(true);
    setStep(target);
  }

  function advance() {
    setStep(editing || step === 2 ? 3 : 2);
    setEditing(false);
  }

  function start() {
    if (submitting || (!requiresSignIn && !credit?.can_start)) return;
    if (submission?.error) {
      submission.retry();
      return;
    }
    const payload = flow.buildPayload();
    if (payload) onStartAnalysis?.({
      ...buildOnboardingPayload({ ...payload, userNote: requestLines.join('\n') || undefined }, {
        ...initialChoices(''), preserved, budgetMode: purchaseBudget ? 'limit' : 'unknown', budget,
      }),
      imageOutputMode: 'api',
    });
  }

  const photo = flow.image;
  const hasCredit = requiresSignIn || credit?.can_start;
  return <div className="shi" dir={siteDirection()}>
    <Header />
    <main className="shi-main">
      <div className="shi-top">
        <span className="shi-wordmark">{copy('استودیو طراحی')}</span>
        <div className="shi-links">{introduction}<Link to="/studio/projects">{copy('طراحی‌های من')}</Link></div>
      </div>
      <div className="shi-layout">
        <section className="shi-content" aria-labelledby="shi-title">
          <div className="shi-progress" aria-label={copy('مراحل آماده‌سازی طراحی')}>
            <span>{copy('{{current}} از {{total}}', { current: number.format(step), total: number.format(3) })}</span>
            <span>{copy(['عکس فضا', 'خواسته و محدودیت‌ها', 'مرور و شروع'][step - 1])}</span>
          </div>
          <h1 id="shi-title" tabIndex={-1} ref={heading}>{copy(titles[step - 1])}</h1>
          {step === 1 && <>
            <p className="shi-description">{copy('یه عکس از اتاقت انتخاب کن. هما با همین عکس شروع می‌کنه.')}</p>
            <div className="shi-pickers">
              <button type="button" className={photo ? 'shi-secondary' : 'shi-primary'} disabled={flow.preparing} onClick={() => openPicker('gallery')}>
                <ImagePlus size={18} aria-hidden="true" />{copy(photo ? 'تعویض عکس' : 'انتخاب عکس فضای من')}
              </button>
              {guideSeen && <button type="button" className="shi-text-button" disabled={flow.preparing} onClick={() => openPicker('camera')}>
                <Camera size={17} aria-hidden="true" />{copy('گرفتن عکس با دوربین')}
              </button>}
            </div>
            {flow.preparing && <p className="shi-note" role="status">{copy('در حال آماده‌سازی عکس…')}</p>}
            {flow.error && <p className="shi-error" role="alert">{copy('این عکس باز نشد. یه عکس دیگه انتخاب کن.')}</p>}
            {flow.imageTooSmall && <p className="shi-note">{copy('عکس واضح‌تر جزئیات بیشتری نشون می‌ده.')}</p>}
          </>}
          {step === 2 && <>
            <p className="shi-description">{copy('اگه هنوز ایده‌ای نداری، هما از روی عکس پیشنهاد می‌ده.')}</p>
            <fieldset className="shi-intents"><legend className="sr-only">{copy('خواسته‌ات')}</legend>
              {intents.map(([label], index) => <label key={label}>
                <input type="radio" name="studio-intent" checked={intent === index} onChange={() => setIntent(index)} />{copy(label)}
              </label>)}
            </fieldset>
            <label className="shi-label" htmlFor="shi-wish">{copy(intents[intent][1])} <span>{copy('اختیاری')}</span></label>
            <textarea id="shi-wish" value={flow.note} rows={4} maxLength={2000} onChange={event => flow.setNote(event.target.value)}
              placeholder={copy(['مثلاً نور گرم‌تر باشه و مبل فعلی بمونه.', 'مثلاً مسیر کنار میز تنگه.', 'مثلاً چوب روشن و نور ملایم.', 'مثلاً یه فرش برای جلوی مبل.'][intent])} />
            {intent === 3 && <label className="shi-field">{copy('سقف خرید (تومان)')} <small>{copy('اختیاری')}</small>
              <input inputMode="numeric" value={budget} aria-invalid={invalidBudget} onChange={event => setBudget(event.target.value)} />
              {invalidBudget && <span role="alert">{copy('مبلغ رو به تومان و با عدد بنویس.')}</span>}
            </label>}
            <details className="shi-keep" open={preserved.trim() ? true : undefined}>
              <summary>{copy('وسیله‌ای هست که حتماً باید بمونه؟')}</summary>
              <label className="shi-field">{copy('وسایل قابل حفظ')}
                <input value={preserved} maxLength={360} placeholder={copy('مثلاً میز چوبی و مبل فعلی')} onChange={event => setPreserved(event.target.value)} />
              </label>
            </details>
          </>}
          {step === 3 && <>
            <dl className="shi-review">
              <div><dt>{copy('عکس فضای من')}</dt><dd><button className="shi-text-button" type="button" disabled={submitting} onClick={() => edit(1)}>{copy('ویرایش عکس')}</button></dd></div>
              <div><dt>{copy('خواسته‌ات')}</dt><dd><button className="shi-text-button" type="button" disabled={submitting} onClick={() => edit(2)}>{copy('ویرایش خواسته')}</button></dd></div>
            </dl>
            <p className="shi-wish">{requestLines.length ? requestLines.join('\n') : copy('پیشنهاد طراحی با هما')}</p>
            <h2 className="shi-label">{copy('چه چیزی تحویل می‌گیری؟')}</h2>
            <ol className="shi-results">{['طرح پیشنهادی روی عکس خونه‌ات', 'پیشنهاد حفظ، جابه‌جایی یا تعویض وسایل', 'محصولات مناسب برای خریدهای لازم'].map(value => <li key={value}>{copy(value)}</li>)}</ol>
            <div className="shi-credit">
              {requiresSignIn ? <p>{copy('برای بررسی اعتبار و ذخیرهٔ طراحی وارد حساب شو.')}</p>
                : creditError ? <><p role="alert">{copy('اعتبار بررسی نشد. دوباره تلاش کن.')}</p>
                  <button type="button" className="shi-text-button" onClick={() => setCreditAttempt(value => value + 1)}>{copy('تلاش دوباره')}</button></>
                : <p role="status">{copy(!credit ? 'در حال بررسی اعتبار…' : credit.gift ? 'این طراحی با اعتبار هدیه انجام می‌شه.'
                  : credit.can_start ? 'برای شروع یک اعتبار طراحی مصرف می‌شه.' : 'اعتبار کافی برای شروع طراحی نداری.')}</p>}
            </div>
            {submission?.error && <p className="shi-error" role="alert">{copy(submission.error)}</p>}
          </>}
          {(step !== 1 || photo) && <div className="shi-actions">
            {(step !== 1 || editing) && <button type="button" className="shi-text-button" disabled={submitting}
              onClick={() => {
                if (submission?.error) onEditSubmission?.();
                setStep(editing ? 3 : step === 3 ? 2 : 1);
                setEditing(false);
              }}><Back size={17} aria-hidden="true" />{copy('قبلی')}</button>}
            <button className="shi-primary" type="button" disabled={flow.preparing || submitting || step === 2 && invalidBudget || step === 3 && !hasCredit} onClick={step === 3 ? start : advance}>
              {copy(submitting ? 'در حال ثبت درخواست…' : step === 3 ? requiresSignIn ? 'ورود و ادامه' : submission?.error ? 'تلاش دوباره'
                : 'شروع طراحی فضای من' : editing ? 'بازگشت به مرور' : step === 1 ? 'ادامه با این عکس' : 'مرور درخواست')}
              <Next size={17} aria-hidden="true" />
            </button>
          </div>}
        </section>
        <figure className="shi-photo" data-user-photo={!!photo}>
          <img src={photo?.dataUrl || `/images/home-story/wardrobe-v20261121-${sampleAfter ? 'after' : 'before'}.webp`} alt={copy(photo ? 'عکس فضای شما' : sampleAfter ? 'طرح کمد دیواری همان اتاق' : 'دیوار اتاق پیش از طراحی کمد')} />
          {!photo && <figcaption className="shi-sample"><span>{copy('نمونهٔ طراحی کمد')}</span><div>
            {['قبل', 'طرح هما'].map((label, index) => <button type="button" key={label} aria-pressed={sampleAfter === !!index} onClick={() => setSampleAfter(!!index)}>{copy(label)}</button>)}
          </div></figcaption>}
          {photo && <Dialog>
            <DialogTrigger className="shi-expand" aria-label={copy('بزرگ‌کردن عکس')}><Maximize2 size={17} aria-hidden="true" /></DialogTrigger>
            <DialogContent className="shi-preview-dialog" dir={siteDirection()}>
              <DialogTitle className="sr-only">{copy('عکس فضای شما')}</DialogTitle>
              <DialogDescription className="sr-only">{copy('پیش‌نمایش عکس فضای شما')}</DialogDescription>
              <img src={photo.dataUrl} alt={copy('عکس فضای شما')} />
            </DialogContent>
          </Dialog>}
        </figure>
      </div>
      <input ref={gallery} className="sr-only" tabIndex={-1} type="file" aria-label={copy('انتخاب عکس از گالری')} accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={event => { const file = event.target.files?.[0]; if (file) void flow.pickImage(file, 'gallery'); event.target.value = ''; }} />
      <input ref={camera} className="sr-only" tabIndex={-1} type="file" aria-label={copy('عکس با دوربین')} accept="image/*" capture="environment"
        onChange={event => { const file = event.target.files?.[0]; if (file) void flow.pickImage(file, 'camera'); event.target.value = ''; }} />
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="shi-photo-guide" dir={siteDirection()}
          onCloseAutoFocus={event => { event.preventDefault(); pickButton.current?.focus(); }}>
          <DialogTitle>{copy('چه عکسی برای طراحی بهتره؟')}</DialogTitle>
          <DialogDescription className="sr-only">{copy('نمونهٔ کادر مناسب و نامناسب از یک اتاق')}</DialogDescription>
          <div className="shi-examples">
            <figure><div><img src={example} alt={copy('نمای باز از گوشهٔ اتاق')} /></div>
              <figcaption><strong>{copy('عکس مناسب')}</strong><span>{copy('گوشی صاف و بخش اصلی فضا توی کادر.')}</span></figcaption></figure>
            <figure><div><img src={example} alt={copy('نمای نزدیک و کج از همان اتاق')} /></div>
              <figcaption><strong>{copy('عکس نامناسب')}</strong><span>{copy('عکس کج یا نزدیک، بخشی از فضا رو می‌بُره.')}</span></figcaption></figure>
          </div>
          <div className="shi-guide-actions">
            <button type="button" className="shi-primary" onClick={() => usePicker('gallery')}>{copy('انتخاب از گالری')}</button>
            <button type="button" className="shi-secondary" onClick={() => usePicker('camera')}>{copy('گرفتن عکس با دوربین')}</button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  </div>;
}
