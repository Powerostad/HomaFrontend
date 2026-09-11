import { readFile, writeFile } from 'node:fs/promises';
const file = new URL('../dist/client/index.html', import.meta.url);
const template = await readFile(file, 'utf8');
await writeFile(new URL('../dist/client/offline-shell.html', import.meta.url), template
  .replace('<!--seo-head-->', '<title>هما</title><meta name="robots" content="noindex, follow">')
  .replace('<!--ssr-outlet-->', '').replace('<!--seo-data-->', ''));
