import { useEffect } from 'react';

/**
 * Per-route SEO head management — dependency-free.
 *
 * Updates <title>, meta description, canonical, and Open Graph / Twitter tags
 * imperatively when a page mounts or its data changes. Googlebot executes the
 * effect during rendering, so these values are indexed per route despite this
 * being a client-rendered SPA.
 *
 * NOTE: Social scrapers (Telegram, WhatsApp, Twitter) do NOT run JS and only
 * read the static index.html. Fixing link-preview cards for those requires
 * server/edge meta injection or prerendering — out of scope for this hook.
 */

export interface SeoConfig {
  /** Page title. The site name is appended automatically. */
  title?: string;
  description?: string;
  /** Absolute canonical URL. Defaults to origin + current pathname. */
  canonical?: string;
  /** Absolute image URL for social cards. */
  image?: string;
  /** Open Graph type. Defaults to 'website'. */
  type?: 'website' | 'product' | 'article';
}

const SITE_NAME = 'HOMA';

// Falls back to these whenever a page omits a field or unmounts. Keep in sync
// with the static defaults in index.html.
const DEFAULTS = {
  title: 'HOMA - مشاهده محصول در فضای شما',
  description: 'HOMA - پلتفرم هوش مصنوعی برای مشاهده محصولات در فضای شما',
  image: '',
  type: 'website' as const,
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function applySeo(config: SeoConfig) {
  const title = config.title ? `${config.title} | ${SITE_NAME}` : DEFAULTS.title;
  const description = config.description || DEFAULTS.description;
  const type = config.type || DEFAULTS.type;
  const image = config.image || DEFAULTS.image;
  const url =
    config.canonical ||
    (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', type);
  if (url) upsertMeta('property', 'og:url', url);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
  }
  if (url) upsertCanonical(url);
}

/**
 * Set per-route SEO metadata. Re-applies whenever any field changes; resets to
 * site defaults on unmount so a slow page transition never leaves stale meta.
 */
export function useSeo(config: SeoConfig) {
  useEffect(() => {
    applySeo(config);
    return () => applySeo({});
  }, [config.title, config.description, config.canonical, config.image, config.type]);
}
