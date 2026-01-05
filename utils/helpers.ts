/**
 * Converts English digits in a string to Persian digits.
 */
export const toPersianDigits = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return value.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

/**
 * Formats a date to a simple Persian relative or absolute string.
 */
export const formatPersianDate = (date: Date | string): string => {
  // Simple mock for now
  return "۲ روز پیش";
};
