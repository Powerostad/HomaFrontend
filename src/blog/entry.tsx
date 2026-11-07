import { renderToStaticMarkup } from 'react-dom/server';
import { BlogView } from './BlogView';
import { blogSeo } from './seo';
import type { BlogData } from './types';
import { escapeHtml } from '../seo/metadata';
export function renderBlogDocument(data: BlogData, origin: string, path: string, template: string, stylesheet = '/blog.css') {
  const meta = blogSeo(data, origin, path);
  const schema = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
  const analytics = data.kind === 'article' ? '<script src="/config.js"></script><script defer src="/blog-analytics.js"></script>' : '';
  const head = `<title>${escapeHtml(meta.title)} | HOMA</title><meta name="description" content="${escapeHtml(meta.description)}"><meta name="robots" content="${meta.robots}"><link rel="canonical" href="${escapeHtml(meta.canonical)}"><meta property="og:title" content="${escapeHtml(meta.title)}"><meta property="og:description" content="${escapeHtml(meta.description)}"><meta property="og:type" content="${meta.type}"><meta property="og:url" content="${escapeHtml(meta.canonical)}">${meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}">` : ''}<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}"><link rel="stylesheet" href="${escapeHtml(stylesheet)}"><script type="application/ld+json">${schema}</script>`;
  return template.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta[^>]+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/gi, '').replace(/<link[^>]+rel="canonical"[^>]*>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<link[^>]+rel="(?:modulepreload|stylesheet)"[^>]*>/gi, '').replace(/<link[^>]+rel="preload"[^>]+as="image"[^>]*>/gi, '').replace('</head>', head + analytics + '</head>').replace(/<html[^>]*>/, '<html lang="fa" dir="rtl">').replace(/<div id="root"><\/div>/, `<div id="root">${renderToStaticMarkup(<BlogView data={data} retryHref={path} />)}</div>`);
}
