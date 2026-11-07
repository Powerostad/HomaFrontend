import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { aggregateReport, renderReport } from './blog-performance/core.mjs';
import { collectSnapshot } from './blog-performance/collect.mjs';

const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
if (args.includes('--help')) {
  console.log('npm run report:blog -- --start YYYY-MM-DD --end YYYY-MM-DD\nOr: --input aggregated-snapshot.json\nSecrets are read only from environment; see docs/BLOG-PERFORMANCE.md.');
} else {
  const snapshot = option('--input') ? JSON.parse(await readFile(option('--input'), 'utf8')) : await collectSnapshot(option('--start'), option('--end'));
  const report = aggregateReport(snapshot);
  const directory = resolve('reports/blog-performance', `${report.start}_${report.end}`);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'snapshot.json'), JSON.stringify(snapshot, null, 2));
  await writeFile(join(directory, 'report.json'), JSON.stringify(report, null, 2));
  await writeFile(join(directory, 'index.html'), renderReport(report));
  console.log(`Internal aggregate report: ${join(directory, 'index.html')}`);
}
