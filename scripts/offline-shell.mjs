import { readFile, writeFile } from 'node:fs/promises';
const file = new URL('../dist/index.html', import.meta.url);
const template = await readFile(file, 'utf8');
await writeFile(new URL('../dist/offline-shell.html', import.meta.url), template
  .replace('</head>', '<meta name="robots" content="noindex, follow"></head>'));
