import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlogView } from './BlogView';
import { renderBlogDocument } from './entry';
import { blogSeo } from './seo';
import { safeLink, type BlogPost } from './types';
const post: BlogPost = { title: 'انتخاب پرده', slug: 'curtain-guide', excerpt: 'نور و حریم خصوصی', body: '## نور\n\nمتن با <img src=x onerror=alert(1)> و [لینک](javascript:alert).\n\n## انتخاب\n\n[طراحی](/studio)', category: { title: 'پرده', slug: 'curtains', description: '' }, cover_url: '', cover_alt: '', author_name: 'تحریریه هما', published_at: '2026-10-28T12:00:00Z', updated_at: '2026-10-29T12:00:00Z', reading_minutes: 2, seo_title: 'راهنمای انتخاب پرده', meta_description: 'انتخاب پرده مناسب خانه' };
const template = '<html><head><title>Old</title><meta name="description" content="old"><script type="module" src="/assets/main.js"></script></head><body><div id="root"></div></body></html>';
describe('Homa blog', () => {
  it('renders full article and navigation without client JavaScript', () => {
    const html = renderBlogDocument({ kind: 'article', post, related: [] }, 'https://homa.test', '/blog/curtain-guide', template);
    expect(html).toContain('lang="fa" dir="rtl"');
    expect(html).toContain('<h1>انتخاب پرده</h1>');
    expect(html).toContain('id="section-0"');
    expect(html).toContain('BlogPosting');
    expect(html).toContain('https://homa.test/blog/curtain-guide');
    expect(html).not.toContain('/assets/main.js');
    expect(html.match(/<title>/g)).toHaveLength(1);
  });
  it('uses versioned editorial CSS without loading the Studio stylesheet', () => {
    const html = renderBlogDocument({ kind: 'article', post, related: [] }, 'https://homa.test', '/blog/curtain-guide', template.replace('</head>', '<link rel="stylesheet" href="/assets/studio.css"></head>'), '/blog-abcd1234.css');
    expect(html).toContain('href="/blog-abcd1234.css"');
    expect(html).not.toContain('/assets/studio.css');
  });
  it('clearly labels existing inspiration covers without claiming an executed project', () => {
    const html = renderBlogDocument({ kind: 'article', post: { ...post, slug: 'bedding-beyond-color' }, related: [] }, 'https://myhoma.ir', '/blog/bedding-beyond-color', template);
    expect(html).toContain('/images/comparison/bedding/after.webp');
    expect(html).toContain('تصویر الهام‌بخش هما');
    expect(html).toContain('https://myhoma.ir/images/comparison/bedding/after.webp');
  });
  it('escapes article HTML and rejects unsafe links and schema closing tags', () => {
    const html = renderBlogDocument({ kind: 'article', post: { ...post, title: '</script><script>alert(1)</script>' }, related: [] }, 'https://homa.test', '/blog/curtain-guide', template);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('</script><script>alert(1)');
    expect(html).toContain('href="/studio"');
    expect(safeLink('//bad.test')).toBe('');
    expect(safeLink('javascript:alert(1)')).toBe('');
  });
  it('renders category links and real pagination, and noindexes empty/error pages', () => {
    const data = { kind: 'index' as const, posts: [post], categories: [post.category], category: post.category, page: 2, count: 25, has_next: true };
    const html = renderToStaticMarkup(<BlogView data={data} />);
    expect(html).toContain('/blog/category/curtains?page=3');
    expect(html).toContain('href="/blog/category/curtains"');
    expect(blogSeo({ ...data, posts: [] }, 'https://homa.test', '/blog').robots).toContain('noindex');
    expect(blogSeo({ kind: 'not-found' }, 'https://homa.test', '/blog/missing').jsonLd).toEqual([]);
  });
  it('renders sanitized imported tables and inline illustrations in server HTML', () => {
    const imported: BlogPost = { ...post, body_format: 'html', body: '<h2 id="size">ابعاد</h2><table><tr><th>عرض</th><td>۸۰</td></tr></table><img src="/api/blog/assets/diagram.svg/" alt="نقشه میز">' };
    const html = renderBlogDocument({ kind: 'article', post: imported, related: [] }, 'https://myhoma.ir', '/blog/curtain-guide', template);
    expect(html).toContain('<table>');
    expect(html).toContain('journal-reading-without-toc');
    expect(html).toContain('/api/blog/assets/diagram.svg/');
    expect(html).not.toContain('&lt;table');
  });

});
