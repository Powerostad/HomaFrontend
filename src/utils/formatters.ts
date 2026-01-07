/**
 * Formatters - Shared formatting utilities
 *
 * This module consolidates formatting functions that were duplicated
 * across multiple components.
 */

/**
 * Persian/Farsi digit mapping
 */
const FARSI_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert English digits to Persian/Farsi digits
 *
 * @example
 * toPersianDigits(1234) // '۱۲۳۴'
 * toPersianDigits('1,234') // '۱,۲۳۴'
 */
export function toPersianDigits(value: number | string): string {
  return value.toString().replace(/\d/g, (x) => FARSI_DIGITS[parseInt(x)]);
}

/**
 * Format price from Rial (backend) to Toman (display)
 *
 * IMPORTANT: All backend prices are stored in Rial. This function converts
 * to Toman (1 Toman = 10 Rial) and formats with Persian digits.
 *
 * @param priceInRials - Price in Rials from backend API
 * @param showCurrency - Whether to append "تومان" suffix (default: true)
 * @returns Formatted price string with Persian digits
 *
 * @example
 * formatPriceFromRial(15000000) // '۱,۵۰۰,۰۰۰ تومان'
 * formatPriceFromRial(15000000, false) // '۱,۵۰۰,۰۰۰'
 * formatPriceFromRial(0) // '۰ تومان'
 */
export function formatPriceFromRial(priceInRials: number, showCurrency = true): string {
  // Convert Rial to Toman (1 Toman = 10 Rial)
  const priceInToman = Math.round(priceInRials / 10);
  // Format with Persian digits and thousand separators
  const formatted = toPersianDigits(priceInToman.toLocaleString('fa-IR'));
  return showCurrency ? `${formatted} تومان` : formatted;
}

/**
 * Format price with Persian digits and thousands separator
 *
 * @deprecated Use formatPriceFromRial() for backend prices (which are in Rial)
 * @example
 * formatPrice(3450000) // '۳,۴۵۰,۰۰۰'
 */
export function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString('fa-IR'));
}

/**
 * Format price with currency suffix
 *
 * @deprecated Use formatPriceFromRial() for backend prices (which are in Rial)
 * @example
 * formatPriceWithCurrency(3450000) // '۳,۴۵۰,۰۰۰ تومان'
 */
export function formatPriceWithCurrency(price: number, currency = 'تومان'): string {
  return `${formatPrice(price)} ${currency}`;
}

/**
 * Format date to Persian locale
 *
 * @example
 * formatDate(new Date()) // '۱۴۰۲/۱۲/۰۵'
 */
export function formatDate(date: Date): string {
  return toPersianDigits(
    date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  );
}

/**
 * Format relative time in Persian
 * Accepts either a timestamp (number) or an ISO date string
 *
 * @example
 * formatRelativeTime(Date.now() - 3600000) // 'یک ساعت پیش'
 * formatRelativeTime('2024-01-15T10:30:00Z') // '۲ روز پیش'
 */
export function formatRelativeTime(input: number | string): string {
  // Convert to timestamp if string (ISO date)
  const timestamp = typeof input === 'string' ? new Date(input).getTime() : input;

  // Handle invalid dates
  if (isNaN(timestamp)) {
    return 'نامشخص';
  }

  const now = Date.now();
  const diff = now - timestamp;

  // Handle future dates
  if (diff < 0) {
    return 'به‌زودی';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) {
    return months === 1 ? 'یک ماه پیش' : `${toPersianDigits(months)} ماه پیش`;
  }
  if (weeks > 0) {
    return weeks === 1 ? 'یک هفته پیش' : `${toPersianDigits(weeks)} هفته پیش`;
  }
  if (days > 0) {
    return days === 1 ? 'دیروز' : `${toPersianDigits(days)} روز پیش`;
  }
  if (hours > 0) {
    return hours === 1 ? 'یک ساعت پیش' : `${toPersianDigits(hours)} ساعت پیش`;
  }
  if (minutes > 0) {
    return minutes === 1 ? 'یک دقیقه پیش' : `${toPersianDigits(minutes)} دقیقه پیش`;
  }
  return 'همین الان';
}
