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
 * Format price with Persian digits and thousands separator
 *
 * @example
 * formatPrice(3450000) // '۳,۴۵۰,۰۰۰'
 */
export function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString('fa-IR'));
}

/**
 * Format price with currency suffix
 *
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
 *
 * @example
 * formatRelativeTime(Date.now() - 3600000) // 'یک ساعت پیش'
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${toPersianDigits(days)} روز پیش`;
  }
  if (hours > 0) {
    return `${toPersianDigits(hours)} ساعت پیش`;
  }
  if (minutes > 0) {
    return `${toPersianDigits(minutes)} دقیقه پیش`;
  }
  return 'همین الان';
}
