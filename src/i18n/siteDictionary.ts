import fa from './locales/fa.json';
import en from './locales/en.json';
import informationFa from './locales/information.fa.json';
import informationEn from './locales/information.en.json';
import extra from './locales/site.en.json';

export const englishSiteCopy: Record<string, string> = {};
function collect(source: unknown, translated: unknown) {
  if (!source || typeof source !== 'object' || !translated || typeof translated !== 'object') return;
  for (const [key, value] of Object.entries(source)) {
    const target = (translated as Record<string, unknown>)[key];
    if (typeof value === 'string' && typeof target === 'string') englishSiteCopy[value.replace(/\s+/g, ' ').trim()] = target;
    else collect(value, target);
  }
}
collect(fa, en);
collect(informationFa, informationEn);
Object.assign(englishSiteCopy, extra);

/** Only for trusted, static UI-copy trees — never API payloads or user input. */
export function translateUiTree<T>(value: T): T {
  if (typeof value === 'string') return (englishSiteCopy[value.replace(/\s+/g, ' ').trim()] ?? value.split('\n\n').map(part => englishSiteCopy[part.replace(/\s+/g, ' ').trim()] ?? part).join('\n\n')) as T;
  if (Array.isArray(value)) return value.map(translateUiTree) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, translateUiTree(child)])) as T;
  return value;
}
