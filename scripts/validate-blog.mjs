// Fail builds when blog pages reference images or internal pages that are missing.
// Run: npm run validate:blog
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve('public');
const pages = [
  'blog/index.html',
  'blog/curtain-small-living-room/index.html',
  'blog/rug-size-living-room/index.html',
  'blog/small-living-room-lighting/index.html',
  'blog/coffee-table-size-shape/index.html',
];
const errors = [];
for (const rel of pages) {
  const absolute = join(root, rel);
  if (!existsSync(absolute)) { errors.push(`Missing page: ${rel}`); continue; }
  const html = readFileSync(absolute, 'utf8');
  if ((html.match(/<h1\b/gi) || []).length !== 1) errors.push(`${rel}: exactly one H1 is required`);
  for (const [label, regex] of [
    ['title', /<title>[^<]+<\/title>/i],
    ['description', /<meta name="description"/i],
    ['canonical', /<link rel="canonical"/i],
    ['schema.org', /application\/ld\+json/i],
  ]) if (!regex.test(html)) errors.push(`${rel}: missing ${label}`);
  for (const m of html.matchAll(/(?:src|href)="(\/blog\/[^"]+)"/g)) {
    const urlPath = m[1];
    const target = join(root, urlPath.slice(1), urlPath.endsWith('/') ? 'index.html' : '');
    if (!existsSync(target)) errors.push(`${rel}: missing linked ${urlPath}`);
  }
  if (rel !== 'blog/index.html' && !/<img[^>]+src="\/blog\/images\//i.test(html)) {
    errors.push(`${rel}: missing primary image`);
  }
}
for (const rel of [
  'blog/images/living-room-curtains-photo.svg',
  'blog/images/living-room-rug-photo.svg',
  'blog/images/living-room-lighting-photo.svg',
  'blog/images/living-room-coffee-table-photo.svg',
]) {
  const absolute = join(root, rel);
  if (!existsSync(absolute) || !readFileSync(absolute, 'utf8').includes('data:image/jpeg;base64,')) {
    errors.push(`${rel}: primary photo illustration missing or malformed`);
  }
}
if (errors.length) {
  console.error('[validate-blog] Failed:\n' + errors.map(e => '- ' + e).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`[validate-blog] OK: ${pages.length} HTML pages and all referenced blog assets`);
}
