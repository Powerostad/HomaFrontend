import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkBrief, checkHtml } from './blog-ai-seo-gate.mjs';

const sample = JSON.parse(await readFile(new URL('../docs/blog/article-brief.example.json', import.meta.url), 'utf8'));

test('A draft records its search intent without pretending to be approved', () => {
  const result = checkBrief(sample);
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.length > 0);
});

test('Publication must be blocked before human approval and evidence', () => {
  const result = checkBrief(sample, true);
  assert.ok(result.errors.some(x => /تأیید|تایید|status|شاهد/.test(x)));
});

test('Approved brief with checked sources and image clears structural gate', () => {
  const candidate = structuredClone(sample);
  candidate.status = 'approved';
  candidate.search.topic_overlap_checked = true;
  candidate.search.iran_serp_review = 'صفحه‌های مشابه فارسی بازبینی شده‌اند؛ هدف تجاری مشخص است.';
  candidate.sources = [{url:'https://developers.google.com/search/docs/appearance/ai-features', claim:'الزام خاص GEO در گوگل وجود ندارد', verified:true}];
  candidate.image.hero_url = 'https://myhoma.ir/blog/images/curtain-example.webp';
  candidate.image.alt = 'پرده روشن در پذیرایی کوچک';
  candidate.editorial = {author:'تیم محتوای هما', fact_checked:true, originality_checked:true, image_checked:true, approved_by:'بازبین داخلی', approved_at:'2026-11-07T10:00:00+03:30'};
  assert.deepEqual(checkBrief(candidate,true).errors,[]);
});

const url = 'https://myhoma.ir/blog/curtain-test/';
const schema = JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'BlogPosting',headline:'پرده مناسب','datePublished':'2026-11-07',author:{'@type':'Organization',name:'هما'}},{'@type':'BreadcrumbList',itemListElement:[]}]});
const html = '<!doctype html><html lang="fa" dir="rtl"><head><title>پرده مناسب | هما</title><meta name="description" content="راهنمای انتخاب پرده"><meta property="og:image" content="https://myhoma.ir/blog/images/example.webp"><link rel="canonical" href="'+url+'"><script type="application/ld+json">'+schema+'</script></head><body><main><h1>چه پرده ای انتخاب کنیم؟</h1><article><p>'+('برای انتخاب پرده باید نور، اندازه پنجره، شرایط دید همسایه و هماهنگی رنگ با مبل را بررسی کرد. ').repeat(6)+'</p></article><a href="/studio/upload">بررسی فضای من</a></main></body></html>';

test('Rendered article with first-response SEO and evidence markup passes', () => {
  const r=checkHtml(html,url);
  assert.deepEqual(r.errors,[]);
});

test('Wrong canonical and duplicate H1 block a published article', () => {
  const r=checkHtml(html.replace(url,'https://myhoma.ir/').replace('</h1>','</h1><h1>دوباره</h1>'),url);
  assert.ok(r.errors.some(x=>x.includes('canonical')));
  assert.ok(r.errors.some(x=>x.includes('H1')));
});

test('A JavaScript-only HTML shell cannot pass post-deploy QA', () => {
  const r=checkHtml('<html><head><title>هما</title></head><body><div id="root"></div></body></html>',url);
  assert.ok(r.errors.some(x=>x.includes('بدنه HTML')));
});
