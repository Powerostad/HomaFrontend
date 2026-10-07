import { siteText } from '@/i18n/siteCopy';
/**
 * Helpers - Common utility functions
 *
 * Re-exports from specialized modules for convenient importing.
 */

// Re-export all formatters
export {
formatDate,formatPrice,
formatPriceWithCurrency,formatRelativeTime,toPersianDigits
} from './formatters';

/**
 * Formats a date to a simple Persian relative or absolute string.
 * @deprecated Use formatRelativeTime from './formatters' instead
 */
export const formatPersianDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const timestamp = date.getTime();
  const now = Date.now();
  const diff = now - timestamp;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return siteText("امروز");
  if (days === 1) return siteText("دیروز");
  if (days < 7) return siteText("{{v0}} روز پیش", { v0: days });
  if (days < 30) return siteText("{{v0}} هفته پیش", { v0: Math.floor(days / 7) });
  return siteText("{{v0}} ماه پیش", { v0: Math.floor(days / 30) });
};
