export interface BlogCategory { title: string; slug: string; description: string; }
export interface BlogPost { title: string; slug: string; excerpt: string; body?: string; body_format?: 'markdown' | 'html'; category: BlogCategory; cover_url: string; cover_alt: string; author_name: string; published_at: string; updated_at: string; reading_minutes: number; seo_title: string; meta_description: string; }
export type BlogData = { kind: 'index'; posts: BlogPost[]; categories: BlogCategory[]; category: BlogCategory | null; page: number; count: number; has_next: boolean } | { kind: 'article'; post: BlogPost; related: BlogPost[] } | { kind: 'not-found' | 'unavailable' };
export const blogPath = (slug: string) => `/blog/${encodeURIComponent(slug)}`;
export const categoryPath = (slug: string) => `/blog/category/${encodeURIComponent(slug)}`;
export function safeLink(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !/[\\\s]/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
}
