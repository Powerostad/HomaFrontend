import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { StaticRouter } from 'react-router-dom/server';
import { PublicPage } from './seo/PublicPage';
import { createPublicI18n } from './seo/i18n';
import { loadPage, type PageOptions } from './seo/loadPage';
import { createCatalogReader } from './seo/catalog';
import { renderHead, serializeJson } from './seo/metadata';
import type { PublicPageData } from './seo/types';
export { loadPage, createCatalogReader };
export { createSitemap } from './seo/sitemap';
export { matchRoute } from './seo/routes';
export function render(data: PublicPageData, template: string, verification: { google?: string; bing?: string } = {}) {
  const html = data.kind === 'private' ? '' : renderToString(<StaticRouter location={data.path}><I18nextProvider i18n={createPublicI18n()}><PublicPage data={data} /></I18nextProvider></StaticRouter>);
  // Bootstrap is inert JSON; no request data is interpolated into executable JS.
  const bootstrap = data.kind === 'private' ? '' : `<script type="application/json" id="homa-page-data">${serializeJson(data)}</script>`;
  const hero = data.kind === 'home' || ['/ai-interior-design', '/virtual-product-preview'].includes(data.path);
  const hints = hero ? '<link rel="preload" as="image" href="/images/hero/after-mobile.webp" media="(max-width: 640px)" fetchpriority="high"><link rel="preload" as="image" href="/images/hero/after.webp" media="(min-width: 641px)" fetchpriority="high">' : '';
  return template.replace('<!--seo-head-->', renderHead(data.seo, verification) + hints)
    .replace('<!--ssr-outlet-->', html).replace('<!--seo-data-->', bootstrap);
}
export type { PageOptions };
