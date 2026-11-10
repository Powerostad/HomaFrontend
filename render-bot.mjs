/** Public document routing shared by human visitors and crawlers. */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { handleBlogRequest } from './blog-http.mjs';
import { documentRoute } from './public-documents.mjs';
const htmlPath = process.env.RENDER_BOT_HTML || '/usr/share/nginx/html/index.html';
const root = dirname(htmlPath);
const template = readFileSync(htmlPath, 'utf8');
const marketing = new Map([['/', 'home'], ['/hosts', 'hosts'], ['/contact', 'contact'], ['/faq', 'faq'], ['/collaboration', 'collaboration']].map(([path, file]) => [path, readFileSync(join(root, `marketing/${file}.html`), 'utf8')]));
const missing = '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, follow"><title>صفحه پیدا نشد | هما</title></head><body><main><h1>این صفحه پیدا نشد.</h1><a href="/">بازگشت به خانه</a> · <a href="/studio">استودیو هما</a></main></body></html>';
createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  if (await handleBlogRequest(req, res, template)) return;
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); res.end(); return; }
  const route = documentRoute(url.pathname);
  if (route.location) { res.writeHead(308, { Location: route.location + url.search }); res.end(); return; }
  const body = route.status === 404 ? missing : marketing.get(route.path) || template;
  res.writeHead(route.status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate', ...(!route.public ? { 'X-Robots-Tag': 'noindex, follow' } : {}) });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(Number(process.env.RENDER_BOT_PORT || 8081), '127.0.0.1', () => console.log('[public-documents] ready'));
