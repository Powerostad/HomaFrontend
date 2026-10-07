import { useTranslation } from 'react-i18next';

/** An explicit, keyboard-accessible shortcut; the existing language menu remains available. */
export function BilingualSwitch() {
  const { i18n } = useTranslation();
  const target = i18n.language.startsWith('en') ? 'fa' : 'en';
  const label = target === 'en' ? 'English' : 'فارسی';
  return (
    <button
      type="button"
      lang={target}
      dir={target === 'fa' ? 'rtl' : 'ltr'}
      className="min-h-11 px-2 text-sm underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label={target === 'en' ? 'Switch to English' : 'تغییر زبان به فارسی'}
      onClick={() => {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', target);
        window.history.replaceState(window.history.state, '', url);
        void i18n.changeLanguage(target);
      }}
    >{label}</button>
  );
}
