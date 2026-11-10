import { writeFile } from 'node:fs/promises';
const origin = new URL(process.env.SITEMAP_SITE_URL || 'https://myhoma.ir').origin;
const routes = ['/', '/hosts', '/explore', '/blog', '/collaboration', '/contact', '/faq', '/privacy', '/terms', '/support'];
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + routes.map(path => `<url><loc>${origin}${path}</loc></url>`).join('\n') + '\n</urlset>\n';
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`Public-route sitemap: ${routes.length} URLs; no catalogue enumeration.`);
