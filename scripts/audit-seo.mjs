import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const base = new URL(option('--base', process.env.SEO_AUDIT_BASE || 'http://127.0.0.1:3000')).origin;
const output = resolve(option('--out', 'reports/seo'));
const indexable = args.includes('--indexable');
const apiBase = option('--api-base', process.env.SEO_AUDIT_API_BASE);
const checks = [];
const check = (route, name, pass, evidence) => checks.push({ route, check: name, expected: name, status: pass ? 'pass' : 'fail', evidence, verifiedAt: new Date().toISOString() });
async function fetchPage(path, userAgent = 'HomaSeoAudit/1.0') {
  const start = performance.now();
  const response = await fetch(new URL(path, base), { headers: { 'User-Agent': userAgent }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const html = await response.text();
  const dom = new JSDOM(html, { url: new URL(path, base).href }); const document = dom.window.document;
  const data = { status: response.status, robots: document.querySelector('meta[name="robots"]')?.content || response.headers.get('x-robots-tag'), title: document.title, canonical: document.querySelector('link[rel="canonical"]')?.href, h1: [...document.querySelectorAll('h1')].map((h) => h.textContent), description: document.querySelector('meta[name="description"]')?.content, image: document.querySelector('meta[property="og:image"]')?.content, links: [...document.querySelectorAll('a[href]')].map((a) => new URL(a.href, base)).filter((u) => u.origin === base).map((u) => u.pathname + u.search), mainText: document.querySelector('main')?.textContent.trim(), schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } }), location: response.headers.get('location'), elapsedMs: Math.round(performance.now() - start) };
  dom.window.close(); return data;
}
await mkdir(output, { recursive: true });
let sitemapPaths = [];
try {
  const response = await fetch(base + '/sitemap.xml', { signal: AbortSignal.timeout(15000) }); const xml = await response.text();
  const dom = new JSDOM(xml, { contentType: 'application/xml' });
  sitemapPaths = [...dom.window.document.querySelectorAll('loc')].map((n) => new URL(n.textContent).pathname);
  dom.window.close();
  check('/sitemap.xml', 'Complete XML sitemap available', response.status === 200 && sitemapPaths.length > 0, { status: response.status, urls: sitemapPaths.length });
} catch (error) { check('/sitemap.xml', 'Complete XML sitemap available', false, error.message); }
const store = sitemapPaths.find((p) => /^\/store\/[^/]+$/.test(p));
const product = sitemapPaths.find((p) => p.includes('/product/'));
const paths = ['/', '/explore', '/gallery', '/ai-interior-design', '/virtual-product-preview', '/contact', '/faq', '/terms', '/collaboration', store, product].filter(Boolean);
const pages = new Map();
for (const path of paths) {
  try {
    const page = await fetchPage(path); pages.set(path, page);
    check(path, 'Successful semantic HTML without JavaScript', page.status === 200 && page.h1.length === 1 && page.mainText?.length > 80, { status: page.status, h1: page.h1, mainCharacters: page.mainText?.length ?? 0, httpElapsedMs: page.elapsedMs });
    check(path, 'Initial metadata and crawlable navigation', Boolean(page.title && page.description && page.canonical && page.image && page.links.length), { title: page.title, canonical: page.canonical, linkCount: page.links.length });
    check(path, 'Environment indexing policy', Boolean(page.robots?.split(',').map((s) => s.trim()).includes(indexable ? 'index' : 'noindex')), page.robots);
    check(path, 'JSON-LD parses', page.schema.length > 0 && page.schema.every(Boolean), page.schema.map((s) => s?.['@type']));
    for (const agent of ['Googlebot', 'bingbot', 'Twitterbot', 'OAI-SearchBot']) {
      const crawler = await fetchPage(path, agent);
      check(path, `Equivalent public content: ${agent}`, crawler.status === page.status && crawler.title === page.title && crawler.mainText === page.mainText && crawler.canonical === page.canonical, { status: crawler.status, title: crawler.title });
    }
  } catch (error) { check(path, 'Page accessible', false, error.message); }
}
for (const path of ['/seo-audit-not-found-92841', '/store/seo-missing-store', '/store/seo-missing-store/product/seo-missing-product', '/account/unknown', '/gallery?page=999999']) {
  try { const page = await fetchPage(path); check(path, 'Real 404', page.status === 404, { status: page.status }); } catch (error) { check(path, 'Real 404', false, error.message); }
}
for (const path of ['/basket', '/account/gallery', '/studio/upload', '/try-on/sample/upload', '/s/private-token']) {
  try { const page = await fetchPage(path); check(path, 'Private route initial noindex', page.status === 200 && page.robots?.includes('noindex'), { status: page.status, robots: page.robots }); } catch (error) { check(path, 'Private route initial noindex', false, error.message); }
}
for (const [path, target] of [['/shop', '/explore'], ['/studio', '/studio/upload'], ['/gallery?page=1', '/gallery']]) {
  try { const page = await fetchPage(path); check(path, 'Permanent alias redirect', [301, 308].includes(page.status) && page.location === target, { status: page.status, target: page.location }); } catch (error) { check(path, 'Permanent alias redirect', false, error.message); }
}
if (args.includes('--crawl')) {
  const seen = new Set(); const queue = ['/explore', '/gallery'];
  while (queue.length && seen.size < 100000) {
    const path = queue.shift(); if (seen.has(path)) continue; seen.add(path);
    try {
      const page = pages.get(path) || await fetchPage(path);
      check(path, 'Catalog link resolves', page.status === 200, { status: page.status });
      for (const link of page.links) if (/^\/(explore|gallery|store)(\/|\?|$)/.test(link) && !seen.has(link)) queue.push(link);
    } catch (error) { check(path, 'Catalog link resolves', false, error.message); }
  }
  const catalogUrls = sitemapPaths.filter((p) => p.startsWith('/store/'));
  const missing = catalogUrls.filter((p) => !seen.has(p));
  check('catalog', 'Every sitemap catalog URL reachable through links', missing.length === 0 && queue.length === 0, { expected: catalogUrls.length, visited: seen.size, missing, crawlLimitReached: queue.length > 0 });
  if (apiBase) {
    try {
      async function enumerate(path) {
        const items = []; let expected;
        for (let page = 1; page <= 10000; page++) {
          const url = new URL(apiBase.replace(/\/$/, '').replace(/\/api$/, '') + '/api' + path);
          url.search = new URLSearchParams({ page: String(page), page_size: '100' }).toString();
          const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(`API returned ${response.status}`);
          const json = await response.json(); const data = json.data ?? json;
          if (!Array.isArray(data.results) || !Number.isSafeInteger(data.count) || (expected !== undefined && expected !== data.count)) throw new Error('Invalid or changing API population');
          expected = data.count; items.push(...data.results);
          if (!data.next) { if (items.length !== expected) throw new Error('Incomplete API population'); return items; }
          if (!data.results.length || items.length >= expected) throw new Error('Invalid API pagination');
        }
        throw new Error('API pagination limit');
      }
      const [shops, products] = await Promise.all([enumerate('/shops/list/'), enumerate('/products/')]);
      const eligibleShops = shops.filter((s) => s.product_count > 0);
      const slugs = new Set(eligibleShops.map((s) => s.slug));
      const expected = new Set([...eligibleShops.map((s) => `/store/${encodeURIComponent(s.slug)}`), ...products.filter((p) => slugs.has(p.shop_slug)).map((p) => `/store/${encodeURIComponent(p.shop_slug)}/product/${encodeURIComponent(p.unique_link)}`)]);
      const absentFromSitemap = [...expected].filter((p) => !catalogUrls.includes(p));
      const absentFromLinks = [...expected].filter((p) => !seen.has(p));
      const unexpected = catalogUrls.filter((p) => !expected.has(p));
      check('catalog', 'API population reconciles with sitemap and links', !absentFromSitemap.length && !absentFromLinks.length && !unexpected.length, { shops: eligibleShops.length, products: products.length, expected: expected.size, absentFromSitemap, absentFromLinks, unexpected });
    } catch (error) { check('catalog', 'API population reconciles with sitemap and links', false, error.message); }
  }
}
const report = { base, recordedAt: new Date().toISOString(), mode: indexable ? 'production-indexable' : 'non-production', checks, passed: checks.filter((c) => c.status === 'pass').length, failed: checks.filter((c) => c.status === 'fail').length };
await writeFile(resolve(output, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(resolve(output, 'audit.md'), `# HOMA SEO audit\n\n${report.recordedAt} — ${base}\n\n${report.passed} passed; ${report.failed} failed. HTTP timing is not a Core Web Vitals measurement.\n\n| Route | Check | Status | Evidence |\n|---|---|---|---|\n` + checks.map((c) => `| ${c.route} | ${c.check} | ${c.status} | ${JSON.stringify(c.evidence).replace(/\|/g, '\\|')} |`).join('\n') + '\n');
console.log(JSON.stringify({ base, passed: report.passed, failed: report.failed, output }));
process.exitCode = report.failed ? 1 : 0;
