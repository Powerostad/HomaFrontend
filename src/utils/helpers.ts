/**
 * Helpers - Common utility functions
 *
 * Re-exports from specialized modules for convenient importing.
 */

// Re-export all formatters
export {
  toPersianDigits,
  formatPrice,
  formatPriceWithCurrency,
  formatDate,
  formatRelativeTime,
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
  if (days === 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 7) return `${days} روز پیش`;
  if (days < 30) return `${Math.floor(days / 7)} هفته پیش`;
  return `${Math.floor(days / 30)} ماه پیش`;
};
