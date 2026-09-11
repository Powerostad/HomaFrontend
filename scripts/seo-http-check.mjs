// Built-renderer integration gate. Fixtures are synthetic and never call production.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { startServer } from '../server.mjs';

let unavailable = false;
const shops = [{ id: 1, slug: 'ci-shop', shop_name: 'فروشگاه آزمایشی', product_count: 21, logo_url: null }];
const products = Array.from({ length: 21 }, (_, i) => ({ id: i + 1, unique_link: `ci-product-${i + 1}`, name: `فرش آزمایشی ${i + 1}`, shop_slug: 'ci-shop', shop_name: shops[0].shop_name, price: 12000000, description: 'توضیحات محصول آزمایشی برای بررسی محتوای صفحه و مسیر خرید', image_url: 'https://myhoma.ir/images/hero/after.webp' }));
const api = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (unavailable) { res.writeHead(503); res.end(); return; }
  let records;
  if (url.pathname === '/api/products/') records = products.filter((p) => (!url.searchParams.has('unique_link') || p.unique_link === url.searchParams.get('unique_link')) && (!url.searchParams.has('shop_slug') || p.shop_slug === url.searchParams.get('shop_slug')));
  else if (url.pathname === '/api/shops/list/') records = shops.filter((s) => !url.searchParams.has('slug') || s.slug === url.searchParams.get('slug'));
  else { res.writeHead(500); res.end('Unexpected API endpoint: detail lookups are forbidden'); return; }
  const page = Number(url.searchParams.get('page') || 1), size = Number(url.searchParams.get('page_size') || 20);
  if (page > 1 && (page - 1) * size >= records.length) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: true, data: { count: records.length, next: page * size < records.length ? '?page=' + (page + 1) : null, results: records.slice((page - 1) * size, page * size) } }));
});
await new Promise((done) => api.listen(0, '127.0.0.1', done));
process.env.VITE_API_BASE_URL = `http://127.0.0.1:${api.address().port}`;
process.env.SEO_INDEXABLE = 'true';
process.env.SITE_URL = 'https://myhoma.ir';
const server = await startServer({ port: 0 });
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    if ((await fetch(base + '/sitemap.xml')).ok) break;
    await new Promise((done) => setTimeout(done, 100));
  }
  const audit = spawn(process.execPath, ['scripts/audit-seo.mjs', '--base', base, '--api-base', process.env.VITE_API_BASE_URL, '--indexable', '--crawl', '--out', 'reports/seo-ci'], { stdio: 'inherit' });
  assert.equal(await new Promise((done) => audit.on('exit', done)), 0);
  const wrong = await fetch(base + '/store/wrong/product/ci-product-1', { redirect: 'manual' });
  assert.equal(wrong.status, 308);
  assert.equal(wrong.headers.get('location'), '/store/ci-shop/product/ci-product-1');
  unavailable = true;
  const outage = await fetch(base + '/gallery?search=uncached-outage');
  assert.equal(outage.status, 503);
  assert.equal(outage.headers.get('retry-after'), '60');
  assert.equal(outage.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(base + '/sitemap.xml')).status, 200);
  console.log('HTTP integration: audit, authoritative redirect, upstream outage and retained sitemap passed.');
} finally {
  await Promise.all([new Promise((done) => server.close(done)), new Promise((done) => api.close(done))]);
}
