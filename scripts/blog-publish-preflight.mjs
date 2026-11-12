#!/usr/bin/env node
// A fail-closed, offline preflight for a normalized Homa blog publication payload.
// It NEVER publishes, authenticates an editor, or calls a production API.
// Actual CMS sync must call it BEFORE setting an article to published.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkBrief } from './blog-ai-seo-gate.mjs';

const has = x => typeof x === 'string' && x.trim().length > 0;
const norm = x => String(x || '').replace(/\s+/g, ' ').trim();
const parse = x => { try { return new URL(x, 'https://myhoma.ir'); } catch { return null; } };
const approvedFields = article => ({
  slug: article?.slug ?? null,
  title: article?.title ?? null,
  seo_title: article?.seo_title ?? null,
  meta_description: article?.meta_description ?? null,
  canonical: article?.canonical ?? null,
  body_html: article?.body_html ?? null,
  hero_image_url: article?.hero_image_url ?? null,
  hero_alt: article?.hero_alt ?? null,
  related_links: article?.related_links ?? null
});
export function contentDigest(article) {
  return createHash('sha256').update(JSON.stringify(approvedFields(article)), 'utf8').digest('hex');
}
export function checkPublication(payload) {
  const errors=[], warnings=[];
  if (payload?.schema_version !== 'homa-blog-publication-v1') errors.push('schema_version باید homa-blog-publication-v1 باشد');
  const brief=payload?.brief || {};
  const article=payload?.article || {};
  const approval=payload?.approval || {};
  const result=checkBrief(brief,true);
  errors.push(...result.errors.map(x=>'بریف: '+x));
  warnings.push(...result.warnings.map(x=>'بریف: '+x));
  if (!has(article.slug) || article.slug !== brief.slug) errors.push('slug مقاله با بریف تأییدشده یکسان نیست');
  if (!has(article.title) || article.title !== brief.title) errors.push('عنوان مقاله با بریف یکسان نیست');
  if (!has(article.seo_title) || article.seo_title !== brief.seo?.title) errors.push('SEO title با بریف یکسان نیست');
  if (!has(article.meta_description) || article.meta_description !== brief.seo?.description) errors.push('Meta description با بریف یکسان نیست');
  if (!has(article.canonical) || article.canonical !== brief.seo?.canonical) errors.push('canonical مقاله با بریف یکسان نیست');
  const hero=parse(article.hero_image_url);
  if (!has(article.hero_image_url) || !hero || hero.protocol !== 'https:' || hero.hostname !== 'myhoma.ir' || !/\.(jpe?g|png|webp)(\?.*)?$/i.test(hero.pathname)) {
    errors.push('تصویر اصلی باید فایل واقعی JPEG/PNG/WebP روی https://myhoma.ir باشد');
  }
  if (article.hero_image_url !== brief.image?.hero_url || !has(article.hero_alt) || article.hero_alt !== brief.image?.alt) {
    errors.push('تصویر و متن جایگزین مقاله باید با نسخه بازبینی‌شده برابر باشند');
  }
  if (!has(article.body_html) || norm(article.body_html.replace(/<[^>]*>/g,' ')).length < 250) {
    errors.push('متن قابل خواندن مقاله کافی نیست یا هنوز آماده انتشار نیست');
  }
  if (/<\s*(script|iframe|form|object)\b/i.test(article.body_html || '') || /\bon\w+\s*=/i.test(article.body_html || '')) {
    errors.push('بدنه شامل عنصر یا صفت اجرایی ناامن است؛ sanitization فعال CMS نیز همچنان الزامی است');
  }
  const links=article.related_links;
  if (!Array.isArray(links) || !links.length || !links.every(x => {
    const u=parse(x?.href);
    return has(x?.anchor) && u && u.hostname==='myhoma.ir' && u.protocol==='https:' && /^\/(blog\/|studio\/upload\/?$)/.test(u.pathname);
  })) errors.push('لینک‌های داخلی باید به URL معتبر و عنوان‌دار در هما اشاره کنند');
  if (JSON.stringify(links||[])!==JSON.stringify(brief.content?.related_links||[])) errors.push('لینک‌های داخلی با بریف بازبینی‌شده تفاوت دارند');
  if (!has(approval.approved_by) || !has(approval.approved_at) || Number.isNaN(Date.parse(approval.approved_at||'')) || !has(approval.review_reference)) {
    errors.push('ثبت هویت بازبین، زمان و شناسه تأیید لازم است');
  }
  if (approval.approved_by !== brief.editorial?.approved_by || approval.approved_at !== brief.editorial?.approved_at) {
    errors.push('اطلاعات تأیید داخل payload و بریف یکسان نیست');
  }
  const digest=contentDigest(article);
  if (!/^[a-f0-9]{64}$/.test(approval.reviewed_sha256||'') || approval.reviewed_sha256!==digest) {
    errors.push('پس از بازبینی، محتوای مقاله تغییر کرده یا هش تأیید نامعتبر است');
  }
  if (article.slug && has(article.body_html) && /<h1\b/i.test(article.body_html)) {
    warnings.push('بدنه مقاله H1 دارد؛ مطمئن شوید قالب صفحه H1 دوم تولید نمی‌کند');
  }
  warnings.push('این ابزار بازبین را احراز هویت نمی‌کند؛ سرویس CMS باید approval را از منبع مورد اعتماد و با دسترسی کنترل‌شده دریافت کند.');
  return {errors,warnings,content_sha256:digest};
}
async function main(){
  const args=process.argv.slice(2), idx=args.indexOf('--file'), file=idx>=0?args[idx+1]:null;
  if (!file){console.error('Usage: node scripts/blog-publish-preflight.mjs --file <publication.json> [--json]');process.exitCode=2;return;}
  let payload;try{payload=JSON.parse(await readFile(resolve(file),'utf8'));}catch(e){console.error('Invalid file: '+e.message);process.exitCode=2;return;}
  const result=checkPublication(payload);
  if(args.includes('--json')) console.log(JSON.stringify({status:result.errors.length?'blocked':'ready',...result},null,2));
  else {
    console.log((result.errors.length?'BLOCKED':'READY')+' '+(payload.article?.slug||file));
    console.log('Content SHA256: '+result.content_sha256);
    result.errors.forEach(x=>console.error('ERROR: '+x));
    result.warnings.forEach(x=>console.warn('WARN: '+x));
  }
  if(result.errors.length)process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
