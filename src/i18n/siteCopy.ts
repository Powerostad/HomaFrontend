import i18n, { type i18n as I18n } from 'i18next';
import { useTranslation } from 'react-i18next';
import { englishSiteCopy } from './siteDictionary';
export { englishSiteCopy } from './siteDictionary';

/** Exact UI-copy translations only. Never sends user text or catalog data to a translation service. */

function textFor(instance: I18n, source: string, values?: Record<string, unknown>) {
  const normalized = source.replace(/\s+/g, ' ').trim();
  const english = instance.language?.startsWith('en');
  const fallback = english ? englishSiteCopy[normalized] ?? source : source;
  return instance.t(normalized, { ns: 'siteCopy', keySeparator: false, nsSeparator: false, defaultValue: fallback, ...values });
}
export const siteText = (source: string, values?: Record<string, unknown>) => textFor(i18n, source, values);
export const siteValue = <T,>(value: T): T => (typeof value === 'string' ? siteText(value) : value) as T;
export const siteDirection = (): 'rtl' | 'ltr' => ['en', 'tr'].includes(i18n.language) ? 'ltr' : 'rtl';
export const siteLocale = () => i18n.language?.startsWith('en') ? 'en-GB' : 'fa-IR';

/** Subscribe without changing component identity or losing in-progress form/chat state. */
export function useSiteTranslation() {
  const { i18n: instance } = useTranslation();
  const siteText = (source: string, values?: Record<string, unknown>) => textFor(instance, source, values);
  return {
    siteText,
    siteValue: <T,>(value: T): T => (typeof value === 'string' ? siteText(value) : value) as T,
    siteDirection: (): 'rtl' | 'ltr' => ['en', 'tr'].includes(instance.language) ? 'ltr' : 'rtl',
    siteLocale: () => instance.language?.startsWith('en') ? 'en-GB' : 'fa-IR',
  };
}
