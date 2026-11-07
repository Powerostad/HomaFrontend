import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
await build({
  entryPoints: ['src/seo/marketingEntry.tsx'], bundle: true, platform: 'node', format: 'esm',
  outfile: 'dist-blog-server/marketing-render.mjs',
  loader: { '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
  define: { 'import.meta.env': JSON.stringify({ PROD: true, DEV: false, MODE: 'production' }) },
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
const { renderMarketingDocument } = await import('../dist-blog-server/marketing-render.mjs');
const launcher = await readFile('render-bot-entrypoint.sh');
if (launcher.includes(13)) throw new Error('Production shell launcher must use LF line endings');
const template = await readFile('dist/index.html', 'utf8');
await mkdir('dist/marketing', { recursive: true });
for (const [path, file] of [['/', 'home'], ['/hosts', 'hosts'], ['/contact', 'contact'], ['/faq', 'faq'], ['/collaboration', 'collaboration']]) {
  const html = renderMarketingDocument(path, template);
  if (!html.includes('<h1') || !html.includes('rel="canonical"') || !html.includes('/studio')) throw new Error('Incomplete public document: ' + path);
  if (path === '/collaboration' && !html.includes('<fieldset disabled=""')) throw new Error('The static form must wait for client initialization, not submit personal information in a GET URL');
  await writeFile(`dist/marketing/${file}.html`, html);
}
console.log('MARKETING_PRERENDER_OK');
