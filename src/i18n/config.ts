import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { seoFa } from '../seo/content';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fa from './locales/fa.json';
import informationEn from './locales/information.en.json';
import informationFa from './locales/information.fa.json';
import tr from './locales/tr.json';
import { translateUiTree } from './siteDictionary';

// Supported languages configuration
export const languages = [
  { code: 'fa', name: 'فارسی', dir: 'rtl', font: 'Vazirmatn' },
  { code: 'ar', name: 'العربية', dir: 'rtl', font: 'Noto Sans Arabic' },
  { code: 'en', name: 'English', dir: 'ltr', font: 'Inter' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', font: 'Inter' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

// Check if a language is RTL
export const isRTL = (lang: string): boolean => {
  return ['fa', 'ar'].includes(lang);
};

// Get language config by code
export const getLanguageConfig = (code: string) => {
  return languages.find((lang) => lang.code === code) || languages[0];
};

// Update document direction and language.
// Only called in the browser (guarded below); never during SSR.
export const updateDocumentLanguage = (lang: string) => {
  const config = getLanguageConfig(lang);
  document.documentElement.dir = config.dir;
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  if (['HOMA - مشاهده محصول در فضای شما', 'HOMA - Product previews in your space'].includes(document.title)) {
    document.title = lang.startsWith('en') ? 'HOMA - Product previews in your space' : 'HOMA - مشاهده محصول در فضای شما';
  }

  // Store preference
  try { localStorage.setItem('i18nextLng', lang); } catch { /* preference storage may be disabled */ }
  const url = new URL(window.location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.set('lang', lang);
    window.history.replaceState(window.history.state, '', url);
  }
};

const i18nInstance = i18n;

if (typeof document !== 'undefined') {
  i18nInstance
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        fa: { translation: fa, information: informationFa },
        ar: { translation: ar },
        en: { translation: { ...en, seo: translateUiTree(seoFa) }, information: informationEn },
        tr: { translation: tr },
      },
      fallbackLng: 'fa', // Persian as fallback
      supportedLngs: ['fa', 'ar', 'en', 'tr'],

      detection: {
        order: ['querystring', 'localStorage', 'htmlTag'],
        lookupQuerystring: 'lang',
        caches: ['localStorage'],
      },

      interpolation: {
        escapeValue: false, // React already escapes
      },

      react: {
        useSuspense: false, // Avoid suspense issues
      },
    });
} else {
  // SSR / Node: no browser detection, no document access.
  i18nInstance.use(initReactI18next).init({
    resources: {
      fa: { translation: fa, information: informationFa },
      ar: { translation: ar },
      en: { translation: { ...en, seo: translateUiTree(seoFa) }, information: informationEn },
      tr: { translation: tr },
    },
    fallbackLng: 'fa',
    supportedLngs: ['fa', 'ar', 'en', 'tr'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

// Set initial document direction based on detected/default language
if (typeof document !== 'undefined') {
  updateDocumentLanguage(i18n.language || 'fa');

  // Listen for language changes
  i18n.on('languageChanged', (lang) => {
    updateDocumentLanguage(lang);
  });
}

export default i18n;
