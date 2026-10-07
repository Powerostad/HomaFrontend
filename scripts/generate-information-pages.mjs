import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const styles = (await read('src/styles/tokens.css')) + '\n' + (await read('src/styles/information.css'));
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

for (const language of ['fa', 'en']) {
const copy = JSON.parse(await read(`src/i18n/locales/information.${language}.json`));
for (const id of ['support', 'privacy', 'terms']) {
  const page = copy[id];
  const draft = id !== 'support';
  const nav = ['support', 'privacy', 'terms'].map((target) =>
    `<a href="/${target}?lang=${language}"${target === id ? ' aria-current="page"' : ''}>${escape(copy[`${target}Label`])}</a>`,
  ).join('');
  const sections = page.sections.map((section) => `<section><h2>${escape(section.title)}</h2>${
    section.paragraphs.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')
  }</section>`).join('');
  const html = `<!doctype html>
<html lang="${language}" dir="${language === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(page.title)}</title><meta name="description" content="${escape(page.summary)}">
${draft ? '<meta name="robots" content="noindex, nofollow">' : ''}
<style>body{margin:0}${styles}</style></head><body>
<div class="homa-information" lang="${language}"><header><a href="/?lang=${language}" class="homa-information-brand" dir="ltr">${escape(copy.brand)}</a><a href="/?lang=${language}">${escape(copy.home)}</a><a href="/${id}?lang=${language === 'fa' ? 'en' : 'fa'}" lang="${language === 'fa' ? 'en' : 'fa'}">${language === 'fa' ? 'English' : 'فارسی'}</a></header>
<nav aria-label="${escape(copy.navigation)}">${nav}</nav>
<main><h1>${escape(page.title)}</h1><p class="homa-information-summary">${escape(page.summary)}</p>
${draft ? `<p class="homa-information-notice">${escape(copy.draftNotice)}</p>` : ''}
<p class="homa-information-scope">${escape(copy.scope)}</p>${sections}</main>
<footer><p>${escape(copy.contact)}: <a href="mailto:FARBOD.LOTFI@PARSMEHRAGRO.COM" dir="ltr">FARBOD.LOTFI@PARSMEHRAGRO.COM</a></p><p>${escape(copy.updated)}</p></footer>
</div></body></html>`;
  const output = new URL(`dist/${id}${language === 'en' ? '.en' : ''}.html`, root);
  await writeFile(output, html);
  console.log(`Generated ${fileURLToPath(output)} (${draft ? 'draft' : 'support'})`);
}
}
