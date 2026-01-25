import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fa from './locales/fa.json';
import ar from './locales/ar.json';
import en from './locales/en.json';
import tr from './locales/tr.json';

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

// Update document direction and language
export const updateDocumentLanguage = (lang: string) => {
  const config = getLanguageConfig(lang);
  document.documentElement.dir = config.dir;
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);

  // Store preference
  localStorage.setItem('i18nextLng', lang);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fa: { translation: fa },
      ar: { translation: ar },
      en: { translation: en },
      tr: { translation: tr },
    },
    fallbackLng: 'fa', // Persian as fallback
    supportedLngs: ['fa', 'ar', 'en', 'tr'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Avoid suspense issues
    },
  });

// Set initial document direction based on detected/default language
updateDocumentLanguage(i18n.language || 'fa');

// Listen for language changes
i18n.on('languageChanged', (lang) => {
  updateDocumentLanguage(lang);
});

export default i18n;
