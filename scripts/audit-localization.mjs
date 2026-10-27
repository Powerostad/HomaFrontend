import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const results = [];
function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'i18n') scan(path); continue; }
    if (!/\.tsx?$/.test(path) || /\.test\./.test(path)) continue;
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node) {
      if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) && /[\u0621-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/.test(node.text)) {
        const fallback = ts.isCallExpression(node.parent) && /(^|\.)t$/.test(node.parent.expression.getText(source));
        const position = source.getLineAndCharacterOfPosition(node.getStart(source));
        results.push({ file: relative(root, path).replaceAll('\\', '/'), line: position.line + 1, kind: ts.SyntaxKind[node.kind], text: node.text.trim(), fallback });
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
scan(join(root, 'src'));
const filter = process.argv[2];
if (filter === '--unique' || filter === '--missing') {
  const fa = JSON.parse(readFileSync('src/i18n/locales/fa.json', 'utf8'));
  const en = JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8'));
  const known = new Set();
  function match(a, b) { for (const [key, value] of Object.entries(a)) { if (typeof value === 'string' && typeof b?.[key] === 'string') known.add(value.trim()); else if (value && typeof value === 'object') match(value, b?.[key]); } }
  match(fa, en);
  match(JSON.parse(readFileSync('src/i18n/locales/information.fa.json', 'utf8')), JSON.parse(readFileSync('src/i18n/locales/information.en.json', 'utf8')));
  if (filter === '--missing') Object.keys(JSON.parse(readFileSync('src/i18n/locales/site.en.json', 'utf8'))).forEach(key => known.add(key));
  const pending = [...new Set(results.filter((item) => (filter === '--missing' || !item.fallback) && !/src\/(data\/mock|utils\/productLoader|components\/BrandColors|pages\/Terms\/)/.test(item.file)).map((item) => item.text.replace(/\s+/g,' ').trim()))].filter((text) => !known.has(text));
  console.log(JSON.stringify(pending.slice(Number(process.argv[3] || 0), Number(process.argv[3] || 0) + Number(process.argv[4] || 80))));
} else if (filter) console.log(JSON.stringify(results.filter((item) => item.file.includes(filter) && !item.fallback)));
else {
  const counts = {};
  for (const item of results.filter((entry) => !entry.fallback)) counts[item.file] = (counts[item.file] || 0) + 1;
  console.log(JSON.stringify({ total: results.length, untranslated: results.filter((item) => !item.fallback).length, files: Object.entries(counts).sort((a, b) => b[1] - a[1]) }));
}
