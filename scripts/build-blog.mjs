import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const globals = await readFile('src/styles/globals.css', 'utf8');
const faces = [...globals.matchAll(/@font-face\s*\{[^}]+\}/g)].map(m => m[0]).filter(s => s.includes('Vazirmatn')).join('\n');
const css = faces + '\n' + await readFile('src/styles/tokens.css', 'utf8') + '\nbody{margin:0}\n' + await readFile('public/blog.css', 'utf8');
const hash = createHash('sha256').update(css).digest('hex').slice(0, 12);
await writeFile('dist/blog.css', css);
await writeFile(`dist/blog-${hash}.css`, css);
await build({
  entryPoints: ['src/blog/entry.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist-blog-server/blog-render.mjs',
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
const { renderBlogDocument } = await import('../dist-blog-server/blog-render.mjs');
const html = renderBlogDocument({kind:'not-found'}, 'https://myhoma.ir', '/blog/missing',
  '<html><head></head><body><div id="root"></div></body></html>');
if (!html.includes('noindex') || !html.includes('canonical')) throw new Error('Missing SEO metadata');
console.log('BLOG_SSR_OK');
