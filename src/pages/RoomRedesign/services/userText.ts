// Exact retired first-photo defaults only; never strip arbitrary user sentences.
const legacyIntake = new Set([
  'یک تغییر سبک با حفظ بیشتر وسایل برای این فضا طراحی کن و تصویر پیشنهادی را نشان بده.',
  'Design a light refresh for this room, keeping most of the existing furniture, and show the proposed image.',
]);

export function restoredUserText(text: string | undefined, firstPhoto: boolean, origin?: string): string {
  const value = (text || '').trim();
  return firstPhoto && origin !== 'user' && legacyIntake.has(value) ? '' : value;
}
