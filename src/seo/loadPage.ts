import { ARTICLES } from './content';
import { CatalogNotFound, UpstreamError, validateProduct, validateShop, type CatalogReader } from './catalog';
import { canonicalSearch, isTrackingParameter, matchRoute, productPath } from './routes';
import { safeHttpUrl, structuredData } from './metadata';
import type { PublicPageData, PublicProduct, PublicShop } from './types';

export interface PageOptions { origin: string; apiBase: string; indexable: boolean; supportUrl?: string; }
export type PageResult = { redirect: string; status: 308 } | { data: PublicPageData; status: number };
const titles: Record<string, [string, string]> = {
  '/': ['طراحی دکوراسیون و مشاهده محصول با هوش مصنوعی', 'با هما برای دکوراسیون خانه ایده بگیرید و محصولات فروشگاه‌ها را پیش از خرید در عکس فضای خود ببینید.'],
  '/explore': ['فروشگاه‌های دکوراسیون و لوازم خانه', 'فروشگاه‌ها را در هما ببینید، محصولات را مقایسه کنید و محصول انتخابی را در فضای خانه خود امتحان کنید.'],
  '/gallery': ['گالری محصولات دکوراسیون خانه', 'محصولات فروشگاه‌های هما را ببینید و برای مشاهده در فضای خود انتخاب کنید.'],
};
export function emptyPage(path: string, options: PageOptions): PublicPageData {
  return { kind: 'private', path, page: 1, total: 0, products: [], shops: [], breadcrumbs: [], status: 200, apiBase: options.apiBase, supportUrl: options.supportUrl,
    seo: { title: 'هما | HOMA', description: 'هما؛ طراحی دکوراسیون و مشاهده محصولات با هوش مصنوعی.', canonical: options.origin + path, robots: 'noindex, follow', image: options.origin + '/images/seo/homa-preview.png', type: 'website', jsonLd: [] } };
}
export async function loadPage(url: URL, read: CatalogReader, options: PageOptions): Promise<PageResult> {
  const route = matchRoute(url.pathname);
  if (route.redirect) return { redirect: route.redirect + url.search, status: 308 };
  if (url.pathname !== route.path && route.kind !== 'missing') return { redirect: route.path + url.search, status: 308 };
  const data = emptyPage(route.path, options);
  const visibleParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => { if (['page', 'search', 'category', 'sort', 'price_min', 'price_max'].includes(key)) visibleParams.set(key, value); });
  data.search = visibleParams.size ? `?${visibleParams}` : '';
  const paginated = route.kind === 'store' || ['/explore', '/gallery'].includes(route.path);
  const rawPage = url.searchParams.get('page');
  if (rawPage !== null && paginated && (!/^[1-9]\d*$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage)))) return failure(data, 404);
  if (paginated && rawPage === '1') { const params = new URLSearchParams(url.search); params.delete('page'); return { redirect: route.path + (params.size ? `?${params}` : ''), status: 308 }; }
  data.page = paginated ? Number(rawPage || 1) : 1;
  data.seo.canonical += canonicalSearch(url.searchParams, paginated);
  let filtered = false;
  const params: Record<string, string | number> = { page: data.page, page_size: 20 };
  url.searchParams.forEach((value, key) => {
    if (!isTrackingParameter(key) && !(key === 'page' && paginated)) filtered = true;
    if (['search', 'category', 'sort', 'price_min', 'price_max'].includes(key)) params[key] = value;
  });
  if (route.kind === 'private') return { data, status: 200 };
  if (route.kind === 'missing') return failure(data, 404);
  data.breadcrumbs = [{ name: 'خانه', path: '/' }];
  try {
    if (route.kind === 'product') {
      const productResult = await read<PublicProduct>('/products/', { unique_link: route.productId!, page_size: 1 });
      if (productResult.count === 0) return failure(data, 404);
      if (productResult.count !== 1 || productResult.results.length !== 1 || productResult.results[0].unique_link !== route.productId) throw new UpstreamError('Exact product filter unavailable');
      const product = validateProduct(productResult.results[0]);
      const shops = await read<PublicShop>('/shops/list/', { slug: product.shop_slug, page_size: 1 });
      if (!shops.count) return failure(data, 404);
      if (shops.count !== 1 || shops.results[0]?.slug !== product.shop_slug) throw new UpstreamError('Exact shop filter unavailable');
      const path = productPath(product.shop_slug, product.unique_link);
      if (route.path !== path) return { redirect: path + url.search, status: 308 };
      data.kind = 'product'; data.product = product; data.shop = validateShop(shops.results[0]);
      data.seo.title = `${product.name} | ${product.shop_name} | هما`;
      data.seo.description = product.description?.slice(0, 180) || `${product.name} از ${product.shop_name} را در عکس فضای خود ببینید و مشخصات محصول را پیش از خرید بررسی کنید.`;
      data.seo.image = safeHttpUrl(product.image_urls?.detail || product.image_url, options.origin) || data.seo.image;
      data.seo.type = 'product';
      data.breadcrumbs.push({ name: 'فروشگاه‌ها', path: '/explore' }, { name: product.shop_name, path: `/store/${encodeURIComponent(product.shop_slug)}` }, { name: product.name, path });
    } else if (route.kind === 'store') {
      const [shops, products] = await Promise.all([
        read<PublicShop>('/shops/list/', { slug: route.slug!, page_size: 1 }),
        read<PublicProduct>('/products/', { ...params, shop_slug: route.slug! }),
      ]);
      if (!shops.count) return failure(data, 404);
      if (shops.count !== 1 || shops.results[0]?.slug !== route.slug || products.results.some((p) => p.shop_slug !== route.slug)) throw new UpstreamError('Exact shop filter unavailable');
      data.kind = 'store'; data.shop = validateShop(shops.results[0]); data.products = products.results.map(validateProduct); data.total = products.count;
      data.seo.title = `محصولات ${data.shop.shop_name} | هما`;
      data.seo.description = `محصولات فروشگاه ${data.shop.shop_name} را ببینید و با هوش مصنوعی در فضای خود امتحان کنید.`;
      data.seo.image = safeHttpUrl(data.shop.logo_url, options.origin) || data.seo.image;
      data.breadcrumbs.push({ name: 'فروشگاه‌ها', path: '/explore' }, { name: data.shop.shop_name, path: route.path });
    } else {
      const article = ARTICLES[route.path];
      const [title, description] = titles[route.path] || [article?.title || 'هما', article?.description || ''];
      data.seo.title = title + ' | هما'; data.seo.description = description;
      if (route.path === '/') data.kind = 'home';
      else if (route.path === '/explore') { const shops = await read<PublicShop>('/shops/list/', params); data.kind = 'explore'; data.shops = shops.results.map(validateShop); data.total = shops.count; }
      else if (route.path === '/gallery') { const products = await read<PublicProduct>('/products/', params); data.kind = 'gallery'; data.products = products.results.map(validateProduct); data.total = products.count; }
      else { data.kind = 'article'; data.seo.type = 'article'; }
      if (route.path !== '/') data.breadcrumbs.push({ name: title, path: route.path });
    }
    if (paginated && data.page > 1 && (data.page - 1) * 20 >= data.total) return failure(data, 404);
    if (data.page > 1) data.seo.title += ` | صفحه ${data.page.toLocaleString('fa-IR')}`;
    data.seo.robots = options.indexable && !(route.path === '/contact' && !options.supportUrl) && !filtered && (!paginated || data.total > 0) ? 'index, follow, max-image-preview:large' : 'noindex, follow';
    data.seo.jsonLd = structuredData(data, options.origin);
    return { data, status: 200 };
  } catch (error) { return failure(data, error instanceof CatalogNotFound ? 404 : 503); }
}
function failure(data: PublicPageData, status: number): PageResult {
  data.kind = status === 404 ? 'not-found' : 'unavailable'; data.status = status;
  data.product = undefined; data.shop = undefined; data.products = []; data.shops = [];
  data.seo.title = status === 404 ? 'صفحه پیدا نشد | هما' : 'دریافت اطلاعات ممکن نشد | هما';
  data.seo.description = status === 404 ? 'این صفحه در دسترس نیست. فروشگاه‌ها و محصولات هما را ببینید.' : 'لطفاً کمی بعد دوباره تلاش کنید.';
  data.seo.robots = 'noindex, follow'; data.seo.jsonLd = [];
  return { data, status };
}
