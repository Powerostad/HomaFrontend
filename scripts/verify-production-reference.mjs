// Offline verification of the published artifact and its recovered React build.
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'docs/production/source-manifest.json'), 'utf8'));
const errors = [];
const hash = data => createHash('sha256').update(data).digest('hex');
for (const [directory, files] of [['production/artifact', manifest.artifact_files], ['production/runtime', manifest.runtime_files]]) {
  for (const [relative, expected] of Object.entries(files)) {
    const target = path.resolve(root, directory, relative);
    if (!target.startsWith(path.resolve(root, directory) + path.sep)) throw new Error('Unsafe evidence path');
    try {
      if (!(await stat(target)).isFile() || hash(await readFile(target)) !== expected) errors.push(`Evidence mismatch: ${directory}/${relative}`);
    } catch { errors.push(`Missing evidence: ${directory}/${relative}`); }
  }
}
if (process.argv.includes('--rebuild')) {
  for (const [relative, expected] of Object.entries(manifest.artifact_files)) {
    if (!relative.startsWith('html/')) continue;
    const output = path.join(root, 'dist', relative.slice(5));
    try {
      if (hash(await readFile(output)) !== expected) errors.push(`Rebuild mismatch: ${relative.slice(5)}`);
    } catch { errors.push(`Missing rebuilt file: ${relative.slice(5)}`); }
  }
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`PRODUCTION_REFERENCE_OK: ${Object.keys(manifest.artifact_files).length} artifact files; runtime evidence${process.argv.includes('--rebuild') ? '; byte-identical rebuild' : ''}`);
