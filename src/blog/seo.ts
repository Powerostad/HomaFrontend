import type { BlogData } from './types';
import { blogPath, categoryPath } from './types';
import { articleCover } from './editorial';
export function blogSeo(data: BlogData, origin: string, path: string) {
  const canonical = origin.replace(/\/$/, '') + path;
  const title = data.kind === 'article' ? data.post.seo_title : data.kind === 'index' ? (data.category?.title || 'مجله هما؛ راهنمای طراحی داخلی و انتخاب وسایل خانه') : data.kind === 'not-found' ? 'مقاله پیدا نشد' : 'مجله موقتاً در دسترس نیست';
  const description = data.kind === 'article' ? data.post.meta_description : data.kind === 'index' ? (data.category?.description || 'راهنمای طراحی داخلی، انتخاب پرده و روتختی، اندازه فرش و چیدمان خانه با هما.') : '';
  const indexable = data.kind === 'article' || data.kind === 'index' && data.posts.length > 0;
  const crumbs: { '@type': string; position: number; name: string; item: string }[] = [{ '@type': 'ListItem', position: 1, name: 'خانه', item: origin + '/' }, { '@type': 'ListItem', position: 2, name: 'مجله هما', item: origin + '/blog' }];
  if (data.kind === 'article') crumbs.push({ '@type': 'ListItem', position: 3, name: data.post.category.title, item: origin + categoryPath(data.post.category.slug) }, { '@type': 'ListItem', position: 4, name: data.post.title, item: origin + blogPath(data.post.slug) });
  if (data.kind === 'index' && data.category) crumbs.push({ '@type': 'ListItem', position: 3, name: data.category.title, item: canonical });
  const jsonLd: Record<string, unknown>[] = [];
  const cover = data.kind === 'article' ? articleCover(data.post) : null;
  const image = cover ? new URL(cover.src, origin).href : '';
  if (indexable) jsonLd.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs });
  if (data.kind === 'article') {
    const p = data.post;
    jsonLd.push({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description, inLanguage: 'fa-IR', datePublished: p.published_at, dateModified: p.updated_at, mainEntityOfPage: canonical, ...(image ? { image } : {}), author: { '@type': p.author_name === 'تحریریه هما' ? 'Organization' : 'Person', name: p.author_name }, publisher: { '@type': 'Organization', name: 'HOMA', url: origin } });
  }
  return { title, description, canonical, image, type: data.kind === 'article' ? 'article' as const : 'website' as const, robots: indexable ? 'index, follow' : 'noindex, follow', jsonLd };
}
