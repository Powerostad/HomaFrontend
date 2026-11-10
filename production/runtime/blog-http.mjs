import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { renderBlogDocument as renderDocument } from './blog-render.mjs';
const htmlRoot = dirname(process.env.RENDER_BOT_HTML || '/usr/share/nginx/html/index.html');
const cssHash = createHash('sha256').update(readFileSync(join(htmlRoot, 'blog.css'))).digest('hex').slice(0, 12);
const renderBlogDocument = (...args) => renderDocument(...args, `/blog-${cssHash}.css`);
const origin = new URL(process.env.SITE_URL || process.env.VITE_API_BASE_URL || 'https://myhoma.ir').origin;
const api = (process.env.BLOG_API_URL || `${(process.env.VITE_API_BASE_URL || 'https://myhoma.ir').replace(/\/$/, '')}/api/blog`).replace(/\/$/, '');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const cache = new Map();
function requestJson(path) {
  return new Promise((resolve, reject) => {
    const target = new URL(api + path);
    const send = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const request = send(target, { headers: { Accept: 'application/json', Host: new URL(origin).host }, timeout: 5000 }, response => {
      let body = ''; let size = 0;
      response.setEncoding('utf8');
      response.on('data', chunk => { size += Buffer.byteLength(chunk); if (size > 2 * 1024 * 1024) request.destroy(new Error('Blog response too large')); else body += chunk; });
      response.on('error', reject);
      response.on('end', () => { try { resolve({ status: response.statusCode, data: response.statusCode === 200 ? JSON.parse(body) : null }); } catch (error) { reject(error); } });
    });
    request.on('timeout', () => request.destroy(new Error('Blog request timed out')));
    request.on('error', reject); request.end();
  });
}
async function read(path) {
  const hit = cache.get(path); if (hit && hit.until > Date.now()) return hit.value;
  const response = await requestJson(path);
  if (response.status === 404) return { kind: 'not-found' };
  if (response.status !== 200) throw new Error('Blog upstream unavailable');
  const envelope = response.data; if (!envelope.success || !envelope.data) throw new Error('Invalid blog response');
  if (cache.size >= 100) cache.delete(cache.keys().next().value);
  cache.set(path, { value: envelope.data, until: Date.now() + 20000 }); return envelope.data;
}
export async function handleBlogRequest(req, res, template) {
  const url = new URL(req.url, origin);
  if (!/^\/blog(?:\/|$)/.test(url.pathname)) return false;
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return true; }
  const send = (status, body, xml = false) => { res.writeHead(status, { 'Content-Type': xml ? 'application/xml; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ...(status >= 400 ? { 'X-Robots-Tag': 'noindex' } : {}) }); res.end(req.method === 'HEAD' ? undefined : body); };
  try {
    if (url.pathname === '/blog/sitemap.xml') {
      const data = await read('/sitemap/');
      const urls = data.posts.map(p => `<url><loc>${escape(origin + '/blog/' + encodeURIComponent(p.slug))}</loc><lastmod>${escape(p.updated_at)}</lastmod></url>`).join('');
      send(200, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, true); return true;
    }
    const path = url.pathname.replace(/\/$/, '');
    const match = path.match(/^\/blog(?:\/(category)\/([^/]+)|\/([^/]+))?$/);
    if (!match) { send(404, renderBlogDocument({ kind: 'not-found' }, origin, path, template)); return true; }
    if (url.pathname !== path) { res.writeHead(308, { Location: path + url.search }); res.end(); return true; }
    const page = url.searchParams.get('page') || '1';
    if (!/^[1-9]\d{0,4}$/.test(page)) { send(404, renderBlogDocument({ kind: 'not-found' }, origin, path, template)); return true; }
    const slug = match[3] ? encodeURIComponent(decodeURIComponent(match[3])) : null;
    const endpoint = slug ? `/posts/${slug}/` : `/posts/?page=${page}${match[1] ? '&category=' + encodeURIComponent(decodeURIComponent(match[2])) : ''}`;
    const data = await read(endpoint);
    const status = data.kind === 'not-found' ? 404 : 200;
    const canonical = path + (!slug && Number(page) > 1 ? '?page=' + Number(page) : '');
    send(status, renderBlogDocument(data, origin, canonical, template)); return true;
  } catch {
    send(503, renderBlogDocument({ kind: 'unavailable' }, origin, url.pathname, template)); return true;
  }
}
