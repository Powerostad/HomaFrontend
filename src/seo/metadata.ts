import type { PublicPageData, SeoMetadata } from './types';

export function safeHttpUrl(value: string | undefined | null, origin?: string) {
  if (!value) return '';
  try { const url = new URL(value, origin); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch { return ''; }
}
export function escapeHtml(value: unknown) { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
export function serializeJson(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
export function structuredData(data: PublicPageData, origin: string): Record<string, unknown>[] {
  if (data.status !== 200 || data.kind === 'private') return [];
  const graph: Record<string, unknown>[] = [];
  if (data.kind === 'home') graph.push(
    { '@context': 'https://schema.org', '@type': 'Organization', '@id': `${origin}/#organization`, name: 'HOMA | هما', url: origin, logo: `${origin}/icons/homa-icon-512.png` },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'HOMA | هما', url: origin, inLanguage: 'fa', publisher: { '@id': `${origin}/#organization` } },
  );
  if (data.breadcrumbs.length > 1) graph.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: data.breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: origin + b.path })) });
  if (data.product) {
    const p = data.product;
    const product: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, url: data.seo.canonical, description: p.description || data.seo.description };
    const image = safeHttpUrl(p.image_urls?.detail || p.image_url, origin);
    if (image) product.image = [image];
    if (Number.isFinite(p.price) && p.price > 0) product.offers = { '@type': 'Offer', price: p.price, priceCurrency: 'IRR', url: data.seo.canonical, seller: { '@type': 'Organization', name: p.shop_name } };
    graph.push(product);
  }
  return graph;
}
export function renderHead(meta: SeoMetadata, verification: { google?: string; bing?: string } = {}) {
  const attr = escapeHtml;
  return `<title>${attr(meta.title)}</title>
<meta name="description" content="${attr(meta.description)}">
<meta name="robots" content="${attr(meta.robots)}">
<link rel="canonical" href="${attr(meta.canonical)}">
<meta property="og:title" content="${attr(meta.title)}">
<meta property="og:description" content="${attr(meta.description)}">
<meta property="og:type" content="${meta.type}">
<meta property="og:url" content="${attr(meta.canonical)}">
<meta property="og:locale" content="fa_IR">
<meta property="og:image" content="${attr(meta.image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(meta.title)}">
<meta name="twitter:description" content="${attr(meta.description)}">
<meta name="twitter:image" content="${attr(meta.image)}">
${verification.google ? `<meta name="google-site-verification" content="${attr(verification.google)}">` : ''}
${verification.bing ? `<meta name="msvalidate.01" content="${attr(verification.bing)}">` : ''}
${meta.jsonLd.map((json) => `<script type="application/ld+json" data-homa-seo>${serializeJson(json)}</script>`).join('\n')}`;
}
