import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import { useSiteTranslation } from '@/i18n/siteCopy';
import { apiGet } from '@/utils/apiClient';
import { BlogView, blogCopy, type BlogCopy } from './BlogView';
import { blogSeo } from './seo';
import type { BlogData } from './types';

export function BlogPage() {
  const location = useLocation();
  const { siteText } = useSiteTranslation();
  const [data, setData] = useState<BlogData | null>(null);
  const copy = Object.fromEntries(Object.entries(blogCopy).map(([key, value]) => [key, siteText(value)])) as BlogCopy;
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    const parts = location.pathname.split('/').filter(Boolean);
    const category = parts[1] === 'category' ? decodeURIComponent(parts[2] || '') : null;
    const article = parts[1] && !category ? decodeURIComponent(parts[1]) : null;
    const endpoint = article ? `/blog/posts/${encodeURIComponent(article)}/` : '/blog/posts/';
    const page = new URLSearchParams(location.search).get('page') || '1';
    apiGet<BlogData>(endpoint, article ? undefined : { page, ...(category ? { category } : {}) }, { skipAuth: true, signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setData(result.success && result.data ? result.data : { kind: result.statusCode === 404 ? 'not-found' : 'unavailable' });
    }).catch(() => { if (!controller.signal.aborted) setData({ kind: 'unavailable' }); });
    return () => controller.abort();
  }, [location.pathname, location.search]);
  const path = location.pathname.replace(/\/$/, '') + (data?.kind === 'index' && data.page > 1 ? `?page=${data.page}` : '');
  const meta = blogSeo(data || { kind: 'unavailable' }, window.location.origin, path);
  useSeo(meta);
  useEffect(() => {
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = meta.robots; document.head.appendChild(robots);
    const schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.textContent = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c'); document.head.appendChild(schema);
    return () => { robots.remove(); schema.remove(); };
  }, [meta.robots, JSON.stringify(meta.jsonLd)]);
  return <><link rel="stylesheet" href="/blog.css" />{data ? <BlogView data={data} copy={copy} retryHref={location.pathname + location.search} /> : <main className="homa-journal journal-empty" aria-busy="true"><p role="status">{siteText('در حال دریافت مطالب مجله…')}</p></main>}</>;
}
