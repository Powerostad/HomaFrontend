import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSiteTranslation } from '@/i18n/siteCopy';
import type { ChipGroup } from '../../RoomRedesign/types';

const key = (profile: string, stage: string) => `homa:prototype:refinement-onboarding:v1:${profile}:${stage}`;
function seen(profile: string, stage: string) {
  try { return localStorage.getItem(key(profile, stage)) === 'seen'; } catch { return false; }
}
function mark(profile: string, stage: string) {
  try { localStorage.setItem(key(profile, stage), 'seen'); } catch { /* In-memory dismissal still works. */ }
}

/** Preview profile only; production will need the authenticated account scope. */
export function useRefinementOnboardingPrototype({ enabled, ready, open, profile = 'local-preview' }: {
  enabled: boolean; ready: boolean; open: boolean; profile?: string;
}) {
  const [hintVisible, setHintVisible] = useState(false);
  const [startersVisible, setStartersVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');
  const hintShown = useRef(false);
  const composerOpened = useRef(false);
  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => { if (!ready || open) setHintVisible(false); }, [ready, open]);
  useEffect(() => {
    if (!enabled || !ready || open || !pageVisible || hintShown.current || seen(profile, 'hint')) return;
    hintShown.current = true; mark(profile, 'hint'); setHintVisible(true);
  }, [enabled, ready, open, profile, pageVisible]);
  const dismiss = () => { hintShown.current = true; mark(profile, 'hint'); setHintVisible(false); };
  const enterComposer = () => {
    if (!enabled) return;
    dismiss();
    if (!composerOpened.current && !seen(profile, 'composer')) {
      composerOpened.current = true; mark(profile, 'composer'); setStartersVisible(true);
    }
  };
  return { hintVisible: enabled && ready && !open && pageVisible && hintVisible,
    startersVisible: enabled && open && startersVisible, dismiss, enterComposer,
    closeComposer: () => setStartersVisible(false) };
}

export const refinementStarterExamples = [
  { id: 'color', label: 'رنگ مبل رو روشن‌تر کن', text: 'دوست دارم رنگ مبل روشن‌تر باشه. چه رنگی با این طراحی هماهنگ‌تره؟' },
  { id: 'layout', label: 'چیدمان رو عوض کن', text: 'می‌خوام یک چیدمان متفاوت برای همین فضا بررسی کنیم.' },
  { id: 'budget', label: 'محصول ارزون‌تر پیشنهاد بده', text: 'برای همین طراحی، محصولی با قیمت کمتر و اندازهٔ مناسب پیشنهاد بده.' },
];

export function refinementStarterGroups(copy: (text: string) => string): ChipGroup[] {
  return [{ id: 'refinement-start', question: copy('یک نمونه رو انتخاب کن و قبل از ارسال، به سلیقهٔ خودت تغییرش بده.'),
    chips: refinementStarterExamples.map(example => ({ id: example.id, label: copy(example.label) })) }];
}

export function RefinementCoachmarkPrototype({ onDismiss, onStart }: { onDismiss: () => void; onStart: () => void }) {
  const { siteText: copy } = useSiteTranslation();
  return createPortal(<aside className="homa-v9 studio-refinement-coachmark" aria-label={copy('راهنمای کوتاه اصلاح طراحی')}>
    <header><span>{copy('HOMA · راهنمای کوتاه')}</span><button type="button" onClick={onDismiss} aria-label={copy('رد کردن راهنمای اصلاح طراحی')}><X size={18} aria-hidden="true" /></button></header>
    <h2>{copy('این تازه شروع طراحی توئه.')}</h2>
    <p>{copy('اگر چیزی مطابق سلیقه‌ات نیست، به هما بگو. می‌تونی دربارهٔ رنگ‌ها، چیدمان و محصولات نظر بدی.')}</p>
    <footer><button type="button" onClick={onStart} aria-haspopup="dialog">{copy('اصلاح طراحی')}</button><small>{copy('فقط برای اولین بار')}</small></footer>
  </aside>, document.body);
}
