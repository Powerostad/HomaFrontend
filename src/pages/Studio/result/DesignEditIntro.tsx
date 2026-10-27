import { MessageSquareText, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './design-edit-intro.css';

export const DESIGN_EDIT_INTRO_STORAGE_KEY = 'homa.studio.design-edit-intro.v1';

function previouslySeen(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(DESIGN_EDIT_INTRO_STORAGE_KEY) === 'seen';
  } catch {
    return false;
  }
}

/** Lightweight first-use explanation, shown only when the real conversation is available. */
export function DesignEditIntro({ onOpenChat }: { onOpenChat: () => void }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(() => !previouslySeen());
  if (!visible) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DESIGN_EDIT_INTRO_STORAGE_KEY, 'seen'); } catch { /* Browsing without storage is supported. */ }
    setVisible(false);
  };

  return (
    <aside className="studio-edit-intro" aria-label={t('studio.v9.editIntroLabel', 'راهنمای اصلاح طرح')}>
      <div className="studio-edit-intro-top">
        <span className="studio-edit-intro-symbol"><MessageSquareText size={18} aria-hidden="true" /></span>
        <span className="studio-edit-intro-eyebrow">{t('studio.v9.editIntroEyebrow', 'یک امکان دیگر در هما')}</span>
        <button className="studio-edit-intro-close" type="button" onClick={dismiss} aria-label={t('common.close', 'بستن راهنما')}><X size={17} /></button>
      </div>
      <h2>{t('studio.v9.editIntroTitle', 'می‌تونی این طراحی رو دقیق‌تر کنی')}</h2>
      <p>{t('studio.v9.editIntroCopy', 'درباره رنگ‌ها، چیدمان یا محصولات نظرت رو به هما بگو؛ لازم نیست به همین پیشنهادها محدود بمونی.')}</p>
      <div className="studio-edit-intro-actions">
        <button className="studio-edit-intro-primary" type="button" onClick={() => { dismiss(); onOpenChat(); }}>{t('studio.v9.editIntroStart', 'اصلاح طرح')}</button>
        <button className="studio-edit-intro-later" type="button" onClick={dismiss}>{t('studio.v9.editIntroLater', 'بعداً')}</button>
      </div>
    </aside>
  );
}
