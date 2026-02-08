/**
 * Formatters - Shared formatting utilities
 *
 * This module consolidates formatting functions that were duplicated
 * across multiple components.
 */

import i18n from '../i18n/config';

/**
 * Digit mappings for different locales
 */
const DIGIT_MAPS: Record<string, string[]> = {
  fa: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
  ar: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  tr: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
};

/**
 * Locale to BCP 47 language tag mapping
 */
const LOCALE_MAP: Record<string, string> = {
  fa: 'fa-IR',
  ar: 'ar-SA',
  en: 'en-US',
  tr: 'tr-TR',
};

/**
 * Get current locale from i18n
 */
function getCurrentLocale(): string {
  return i18n.language || 'fa';
}

/**
 * Convert English digits to locale-specific digits
 *
 * @example
 * toLocalizedDigits(1234) // '۱۲۳۴' (fa) or '١٢٣٤' (ar) or '1234' (en/tr)
 * toLocalizedDigits('1,234') // '۱,۲۳۴' (fa)
 */
export function toLocalizedDigits(value: number | string, locale?: string): string {
  const currentLocale = locale || getCurrentLocale();
  const digits = DIGIT_MAPS[currentLocale] || DIGIT_MAPS['en'];
  return value.toString().replace(/\d/g, (x) => digits[parseInt(x)]);
}

/**
 * Convert English digits to Persian/Farsi digits
 * @deprecated Use toLocalizedDigits() for locale-aware digit conversion
 *
 * @example
 * toPersianDigits(1234) // '۱۲۳۴'
 * toPersianDigits('1,234') // '۱,۲۳۴'
 */
export function toPersianDigits(value: number | string): string {
  return toLocalizedDigits(value, 'fa');
}

/**
 * Format price from Rial (backend) to Toman (display)
 *
 * IMPORTANT: All backend prices are stored in Rial. This function converts
 * to Toman (1 Toman = 10 Rial) and formats with locale-specific digits.
 *
 * @param priceInRials - Price in Rials from backend API
 * @param showCurrency - Whether to append currency suffix (default: true)
 * @returns Formatted price string with locale-specific digits
 *
 * @example
 * formatPriceFromRial(15000000) // '۱,۵۰۰,۰۰۰ تومان' (fa) or '1,500,000 Toman' (en)
 * formatPriceFromRial(15000000, false) // '۱,۵۰۰,۰۰۰' (fa)
 * formatPriceFromRial(0) // '۰ تومان' (fa)
 */
export function formatPriceFromRial(priceInRials: number, showCurrency = true): string {
  const locale = getCurrentLocale();
  const bcp47Locale = LOCALE_MAP[locale] || 'fa-IR';

  // Convert Rial to Toman (1 Toman = 10 Rial)
  const priceInToman = Math.round(priceInRials / 10);

  // Format with thousand separators
  const formatted = toLocalizedDigits(priceInToman.toLocaleString(bcp47Locale), locale);

  if (!showCurrency) {
    return formatted;
  }

  // Get currency label from i18n
  const currency = i18n.t('common.toman', 'تومان');
  return `${formatted} ${currency}`;
}

/**
 * Format price with locale-specific digits and thousands separator
 *
 * @deprecated Use formatPriceFromRial() for backend prices (which are in Rial)
 * @example
 * formatPrice(3450000) // '۳,۴۵۰,۰۰۰' (fa) or '3,450,000' (en)
 */
export function formatPrice(price: number): string {
  const locale = getCurrentLocale();
  const bcp47Locale = LOCALE_MAP[locale] || 'fa-IR';
  return toLocalizedDigits(price.toLocaleString(bcp47Locale), locale);
}

/**
 * Format price with currency suffix
 *
 * @deprecated Use formatPriceFromRial() for backend prices (which are in Rial)
 * @example
 * formatPriceWithCurrency(3450000) // '۳,۴۵۰,۰۰۰ تومان' (fa)
 */
export function formatPriceWithCurrency(price: number, currency?: string): string {
  const currencyLabel = currency || i18n.t('common.toman', 'تومان');
  return `${formatPrice(price)} ${currencyLabel}`;
}

/**
 * Format date to current locale
 *
 * @example
 * formatDate(new Date()) // '۱۴۰۲/۱۲/۰۵' (fa) or '12/05/2024' (en)
 */
export function formatDate(date: Date): string {
  const locale = getCurrentLocale();
  const bcp47Locale = LOCALE_MAP[locale] || 'fa-IR';

  const formatted = date.toLocaleDateString(bcp47Locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return toLocalizedDigits(formatted, locale);
}

/**
 * Format relative time using current locale
 * Accepts either a timestamp (number) or an ISO date string
 *
 * @example
 * formatRelativeTime(Date.now() - 3600000) // 'یک ساعت پیش' (fa) or '1 hour ago' (en)
 * formatRelativeTime('2024-01-15T10:30:00Z') // '۲ روز پیش' (fa) or '2 days ago' (en)
 */
export function formatRelativeTime(input: number | string): string {
  const t = i18n.t.bind(i18n);

  // Convert to timestamp if string (ISO date)
  const timestamp = typeof input === 'string' ? new Date(input).getTime() : input;

  // Handle invalid dates
  if (isNaN(timestamp)) {
    return t('time.unknown', 'نامشخص');
  }

  const now = Date.now();
  const diff = now - timestamp;

  // Handle future dates
  if (diff < 0) {
    return t('common.comingSoon', 'به‌زودی');
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  // Helper: get translated string then replace digits with localized ones
  const localizeTime = (key: string, fallback: string, count: number): string => {
    const result = t(key, fallback, { count });
    return toLocalizedDigits(result);
  };

  if (years > 0) {
    return localizeTime('time.yearsAgo', '{{count}} سال پیش', years);
  }
  if (months > 0) {
    return localizeTime('time.monthsAgo', '{{count}} ماه پیش', months);
  }
  if (weeks > 0) {
    return localizeTime('time.weeksAgo', '{{count}} هفته پیش', weeks);
  }
  if (days > 0) {
    if (days === 1) {
      return t('time.yesterday', 'دیروز');
    }
    return localizeTime('time.daysAgo', '{{count}} روز پیش', days);
  }
  if (hours > 0) {
    return localizeTime('time.hoursAgo', '{{count}} ساعت پیش', hours);
  }
  if (minutes > 0) {
    return localizeTime('time.minutesAgo', '{{count}} دقیقه پیش', minutes);
  }
  return t('time.justNow', 'همین الان');
}

/**
 * Format price range from Rial (backend) to Toman (display)
 *
 * @param range - Object with min and max in Rials
 * @returns Formatted range string like "از ۱,۵۰۰,۰۰۰ تا ۳,۰۰۰,۰۰۰ تومان"
 */
export function formatPriceRangeFromRial(range: { min: number; max: number }): string {
  const t = i18n.t.bind(i18n);
  const minFormatted = formatPriceFromRial(range.min, false);
  const maxFormatted = formatPriceFromRial(range.max, false);
  const currency = t('common.toman', 'تومان');
  if (range.min === range.max) {
    return `${minFormatted} ${currency}`;
  }
  return t('product.priceRange', 'از {{min}} تا {{max}} {{currency}}', {
    min: minFormatted,
    max: maxFormatted,
    currency,
  });
}

/**
 * Format "starting from" price for product cards
 *
 * @param minPriceInRials - Minimum price in Rials
 * @returns Formatted string like "از ۱,۵۰۰,۰۰۰ تومان"
 */
export function formatPriceStartingFrom(minPriceInRials: number): string {
  const t = i18n.t.bind(i18n);
  const formatted = formatPriceFromRial(minPriceInRials, false);
  const currency = t('common.toman', 'تومان');
  return t('product.priceStartingFrom', 'از {{price}} {{currency}}', {
    price: formatted,
    currency,
  });
}
