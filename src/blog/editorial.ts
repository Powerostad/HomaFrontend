import { safeLink, type BlogPost } from './types';

// Existing Homa inspiration photography, explicitly distinguished from projects
// and catalogue product photos. Authored article covers always take precedence.
const inspiration: Record<string, { src: string; alt: string }> = {
  'choose-curtains-for-your-room': { src: '/images/hero/after.webp', alt: 'نمونهٔ الهام‌بخش پرده در چیدمان اتاق' },
  'bedding-beyond-color': { src: '/images/comparison/bedding/after.webp', alt: 'نمونهٔ الهام‌بخش ترکیب روتختی و اجزای تخت' },
  'rug-size-before-pattern': { src: '/images/comparison/rug/after.webp', alt: 'نمونهٔ الهام‌بخش رابطهٔ فرش و مبلمان' },
};
export function articleCover(post: BlogPost) {
  const src = safeLink(post.cover_url);
  return src ? { src, alt: post.cover_alt || post.title, inspiration: false } : inspiration[post.slug] ? { ...inspiration[post.slug], inspiration: true } : null;
}
