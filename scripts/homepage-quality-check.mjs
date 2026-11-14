import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = async path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('homepage source has one H1 and one primary crawlable Studio CTA', async () => {
  const hero = await file('src/pages/ProductLanding/components/HeroSection.tsx');
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.equal((hero.match(/<BeforeAfterSlider\b/g) || []).length, 1);
  assert.match(hero, /<a href="\/studio\/upload"/);
  assert.match(hero, /<a href="\/blog\/"/);
  assert.match(hero, /aria-labelledby="homa-home-title"/);
});

test('hero paints independently of catalog API responses', async () => {
  const page = await file('src/pages/ProductLanding/Page.tsx');
  assert.match(page, /<HeroSection\b/);
  assert.match(page, /<HomeDecisionSection\b/);
  assert.doesNotMatch(page, /if\s*\(\s*isLoading\s*\)/);
  assert.doesNotMatch(page, /return\s*<HomaLoader/);
});

test('hero images use existing WebP and responsive picture convention', async () => {
  const hero = await file('src/pages/ProductLanding/components/HeroSection.tsx');
  const optimized = await file('src/components/OptimizedImage.tsx');
  const index = await file('index.html');
  assert.match(hero, /beforeImage="\/images\/hero\/before\.png"/);
  assert.match(optimized, /<picture>/);
  assert.match(optimized, /-mobile\.webp/);
  assert.match(index, /href="\/images\/hero\/before\.webp"/);
  assert.match(index, /href="\/images\/hero\/before-mobile\.webp"/);
});

test('index metadata has valid schema without a global SPA canonical', async () => {
  const html = await file('index.html');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const data = JSON.parse(scripts[0][1]);
  const types = data['@graph'].map(item => item['@type']);
  assert.deepEqual(types, ['Organization', 'WebSite']);
  assert.match(html, /<title>طراحی دکوراسیون خانه با هوش مصنوعی از روی عکس \| هما<\/title>/);
  assert.match(html, /<meta name="description"/);
  assert.doesNotMatch(html, /<link rel="canonical"/);
});

test('home decision content and blog can be navigated without JS router events', async () => {
  const section = await file('src/pages/ProductLanding/components/HomeDecisionSection.tsx');
  const footer = await file('src/components/Footer.tsx');
  const ssr = await file('src/pages/PublicSeoPages.tsx');
  assert.match(section, /<a href="\/studio\/upload"/);
  assert.match(section, /<a href="\/blog\/"/);
  assert.match(footer, /<a href="\/blog\/"/);
  const homeBlock = ssr.slice(ssr.indexOf('export function SeoHome()'), ssr.indexOf('function Breadcrumbs('));
  assert.match(homeBlock, /<a href="\/studio\/upload"/);
  assert.match(homeBlock, /<a href="\/blog\/"/);
  assert.doesNotMatch(homeBlock, /<a href="\/ai-interior-design"/);
});

test('Persian public copy has coherent decisions and a consistent CTA', async () => {
  const data = JSON.parse(await file('src/i18n/locales/fa.json'));
  assert.match(data.landing.hero.label, /طراحی دکوراسیون خانه با هوش مصنوعی/);
  assert.match(data.landing.hero.description, /حفظ یا جابه‌جا/);
  assert.match(data.landing.hero.cta, /شروع طراحی/);
  assert.match(data.landing.comparison.title, /تغییر دکوراسیون/);
});
