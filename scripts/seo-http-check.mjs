// Test the deployable Nginx + document-router image with a local blog fixture.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

const image = process.argv[2];
assert.ok(image, 'Usage: node scripts/seo-http-check.mjs <frontend-image>');
const origin = 'https://myhoma.ir';
const report = [];
let container;
let unavailable = false;
const post = {
  slug: 'contract-fixture', title: 'Journal contract fixture', seo_title: 'Journal contract fixture',
  excerpt: 'Public journal entry', meta_description: 'Public journal entry',
  author_name: 'Homa', reading_minutes: 1, published_at: '2026-11-01', updated_at: '2026-11-01',
  cover_url: '', cover_alt: '',
  body_format: 'markdown', body: 'Public article content.',
  category: { slug: 'layout', title: 'Layout', description: 'Layout guides' },
};
const fixture = createServer((req, res) => {
  if (unavailable) { res.writeHead(503).end(); return; }
  const pathname = new URL(req.url, origin).pathname;
  const data = pathname === '/api/blog/posts/'
    ? { kind: 'index', posts: [post], categories: [post.category], category: null, page: 1, count: 1, has_next: false }
    : pathname === '/api/blog/sitemap/' ? { posts: [post] }
    : pathname === '/api/blog/posts/contract-fixture/' ? { kind: 'article', post, related: [] } : null;
  res.writeHead(data ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: Boolean(data), data }));
});
fixture.listen(0, '0.0.0.0');
await once(fixture, 'listening');
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();

try {
  container = docker('run', '-d', '-p', '127.0.0.1::80',
    '--add-host', 'host.docker.internal:host-gateway',
    '-e', `BLOG_API_URL=http://host.docker.internal:${fixture.address().port}/api/blog`,
    '-e', `SITE_URL=${origin}`, image);
  const base = 'http://' + docker('port', container, '80/tcp');
  for (let attempt = 0; attempt < 50; attempt++) {
    const ready = await fetch(base + '/', { signal: AbortSignal.timeout(1000) }).catch(() => null);
    if (ready?.ok) break;
    await setTimeout(200);
  }
  async function request(path, options) {
    const response = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(8000), ...options });
    const body = await response.text();
    report.push({ path, userAgent: options?.headers?.['User-Agent'], status: response.status, bytes: Buffer.byteLength(body) });
    return { response, body };
  }
  const agents = ['Mozilla/5.0', 'Googlebot', 'OAI-SearchBot', 'Bingbot'];
  let homepage;
  for (const agent of agents) {
    const { response, body } = await request('/?utm_source=fixture', { headers: { 'User-Agent': agent } });
    assert.equal(response.status, 200);
    assert.equal((body.match(/<h1\b/g) ?? []).length, 1);
    assert.match(body, /<h1[^>]*id="homa-home-title"/);
    assert.match(body, /<title>[^<]*طراحی دکوراسیون خانه با هوش مصنوعی[^<]*<\/title>/);
    assert.match(body, /هوش مصنوعی/);
    assert.match(body, /href="\/studio\/upload"/);
    assert.match(body, /href="\/blog\//);
    assert.match(body, /rel="preload" as="font" href="\/fonts\/vazirmatn-v33\.003\.woff2"/);
    assert.match(body, /rel="canonical" href="https:\/\/myhoma\.ir\/"/);
    assert.equal((body.match(/<meta name="description"/g) ?? []).length, 1);
    const schema = [...body.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)]
      .flatMap(match => JSON.parse(match[1]));
    assert.deepEqual(schema.map(node => node['@type']), ['Organization', 'WebSite']);
    if (homepage) assert.equal(body, homepage, agent + ' must get the browser document');
    homepage = body;
  }
  const studio = await request('/studio/upload');
  assert.equal(studio.response.status, 200);
  assert.match(studio.response.headers.get('x-robots-tag'), /noindex/);
  const font = await fetch(base + '/fonts/vazirmatn-v33.003.woff2');
  assert.equal(font.status, 200);
  assert.match(font.headers.get('content-type'), /font\/woff2/);
  assert.equal(Buffer.from(await font.arrayBuffer()).subarray(0, 4).toString(), 'wOF2');
  assert.equal((await request('/store/private-fixture')).response.status, 404);
  assert.equal((await request('/unknown-public-route')).response.status, 404);
  assert.equal((await request('/blog/')).response.status, 308);
  const journal = await request('/blog');
  assert.equal(journal.response.status, 200);
  assert.match(journal.body, /href="\/blog\/contract-fixture"/);
  const article = await request('/blog/contract-fixture');
  assert.equal(article.response.status, 200);
  assert.match(article.body, /<h1>Journal contract fixture<\/h1>/);
  assert.equal((await request('/blog/missing')).response.status, 404);
  assert.match((await request('/blog/sitemap.xml')).body, /<loc>https:\/\/myhoma\.ir\/blog\/contract-fixture<\/loc>/);
  assert.match((await request('/robots.txt')).body, /Sitemap:\s*https:\/\/myhoma\.ir\/sitemap\.xml/);
  assert.match((await request('/sitemap.xml')).body, /<loc>https:\/\/myhoma\.ir\/<\/loc>/);
  unavailable = true;
  assert.equal((await request('/blog?x=outage&page=2')).response.status, 503);
  assert.equal((await request('/')).body, homepage);
  console.log('Production HTTP contract passed.');
} catch (error) {
  if (container) console.error(docker('logs', '--tail', '25', container));
  throw error;
} finally {
  await mkdir('reports/seo-ci', { recursive: true });
  await writeFile('reports/seo-ci/production-http.json', JSON.stringify(report, null, 2));
  if (container) docker('rm', '-f', container);
  fixture.close();
}
