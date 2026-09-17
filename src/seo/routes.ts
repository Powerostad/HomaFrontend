export const STATIC_PATHS = ['/', '/explore', '/gallery', '/collaboration', '/contact', '/faq', '/terms', '/ai-interior-design', '/virtual-product-preview'] as const;
const aliases: Record<string, string> = { '/shop': '/explore', '/studio': '/studio/upload', '/studio/start': '/studio/upload', '/try-on': '/explore', '/try-on/upload': '/explore', '/try-on/progress': '/explore', '/try-on/result': '/explore' };
const privateRoutes = /^(?:\/(?:upload|precheck|processing|confirmation|result|error|product-not-found|basket)|\/redesign(?:\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?|\/s\/[^/]+|\/studio\/(?:upload|progress|projects)|\/studio\/(?:result|project)\/[^/]+|\/try-on\/[^/]+\/(?:upload|progress|result)|\/account\/(?:gallery|orders|settings)|\/account\/gallery\/[^/]+)$/i;
export type RouteMatch = { kind: 'static' | 'store' | 'product' | 'private' | 'missing'; slug?: string; productId?: string; redirect?: string; path: string };
export function matchRoute(pathname: string): RouteMatch {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (aliases[path]) return { kind: 'private', path, redirect: aliases[path] };
  if ((STATIC_PATHS as readonly string[]).includes(path)) return { kind: 'static', path };
  const product = path.match(/^\/store\/([^/]+)\/product\/([^/]+)$/);
  const store = path.match(/^\/store\/([^/]+)$/);
  try {
    if (product || store) {
      const slug = decodeURIComponent((product || store)![1]);
      const productId = product ? decodeURIComponent(product[2]) : undefined;
      if ([...slug, ...(productId || '')].some((char) => char === '/' || char === '\\' || char.charCodeAt(0) < 32)) return { kind: 'missing', path };
      return { kind: product ? 'product' : 'store', path, slug, productId };
    }
  } catch { return { kind: 'missing', path }; }
  return { kind: privateRoutes.test(path) ? 'private' : 'missing', path };
}
export function productPath(slug: string, id: string) { return `/store/${encodeURIComponent(slug)}/product/${encodeURIComponent(id)}`; }
export function isTrackingParameter(key: string) { return /^(utm_.+|gclid|fbclid|msclkid|ref)$/i.test(key); }
export function canonicalSearch(params: URLSearchParams, paginated: boolean) {
  const result = new URLSearchParams();
  if (paginated && Number(params.get('page')) > 1) result.set('page', String(Number(params.get('page'))));
  return result.size ? `?${result}` : '';
}
