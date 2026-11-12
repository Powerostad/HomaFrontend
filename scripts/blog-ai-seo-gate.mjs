#!/usr/bin/env node
// Portable, dependency-free pre-publication and post-deploy checks for Homa blog.
// This tool never publishes content and does not call internal/private APIs.
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (errors, condition, message) => { if (!condition) errors.push(message); };
const validUrl = (s) => { try { return new URL(s); } catch { return null; } };
const normalize = (v = '') => String(v).replace(/\s+/g, ' ').trim();
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

export function checkBrief(b, approved = false) {
  const e = [], w = [];
  fail(e, b?.schema_version === 'homa-blog-brief-v1', 'schema_version باید homa-blog-brief-v1 باشد');
  fail(e, b?.locale === 'fa-IR', 'locale باید fa-IR باشد');
  fail(e, /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b?.slug || ''), 'slug باید انگلیسی، کوتاه و خط‌تیره‌دار باشد');
  fail(e, ['draft', 'reviewed', 'approved'].includes(b?.status), 'وضعیت باید draft/reviewed/approved باشد');
  fail(e, isStr(b?.title), 'عنوان انسانی وجود ندارد');
  fail(e, isStr(b?.seo?.title), 'SEO title وجود ندارد');
  fail(e, isStr(b?.seo?.description), 'Meta description وجود ندارد');
  const url = validUrl(b?.seo?.canonical);
  fail(e, Boolean(url && url.hostname === 'myhoma.ir' && url.pathname === '/blog/' + b?.slug + '/'), 'canonical باید مسیر واقعی https://myhoma.ir/blog/{slug}/ باشد');
  fail(e, isStr(b?.search?.primary_query), 'پرسش اصلی جست‌وجو مشخص نیست');
  fail(e, isStr(b?.search?.user_question), 'پرسش واقعی مخاطب مشخص نیست');
  fail(e, isStr(b?.search?.intent), 'نیت جست‌وجو مشخص نیست');
  fail(e, isStr(b?.content?.direct_answer), 'پاسخ مستقیم وجود ندارد');
  fail(e, Array.isArray(b?.content?.sections) && b.content.sections.length >= 2 && b.content.sections.every(s => isStr(s.heading) && isStr(s.summary)), 'حداقل ۲ بخش مشخص با خلاصه مفید لازم است');
  fail(e, b?.content?.cta?.href === '/studio/upload' && isStr(b?.content?.cta?.label), 'CTA باید به شروع بررسی فضای هما مرتبط باشد');
  fail(e, isStr(b?.content?.decision_value), 'توضیح دهید خواننده چه تصمیمی می‌تواند بگیرد');
  fail(e, isStr(b?.editorial?.author), 'نویسنده/تحریریه باید مشخص باشد');
  if (isStr(b?.content?.direct_answer) && b.content.direct_answer.length < 90) w.push('پاسخ مستقیم بسیار کوتاه است؛ کفایت معنایی را بررسی کنید');
  if (!Array.isArray(b?.sources) || !b.sources.length) w.push('منبع مستقل برای ادعاهای تخصصی ثبت نشده است');
  if (!isStr(b?.image?.hero_url)) w.push('تصویر اصلی هنوز تعیین نشده است');
  if (b?.image?.is_ai_generated && !isStr(b?.image?.disclosure)) e.push('تصویر AI باید به عنوان تصویرسازی معرفی شود');
  if (approved) {
    fail(e, b?.status === 'approved', 'برای انتشار status باید approved باشد');
    fail(e, b?.search?.topic_overlap_checked === true, 'بازبینی هم‌پوشانی با مقالات موجود لازم است');
    fail(e, isStr(b?.search?.iran_serp_review), 'بازبینی نتایج فارسی باید ثبت شود');
    fail(e, Boolean(b?.editorial?.fact_checked && b?.editorial?.originality_checked && b?.editorial?.image_checked), 'تأیید صحت، اصالت و تصویر لازم است');
    fail(e, isStr(b?.editorial?.approved_by) && !Number.isNaN(Date.parse(b?.editorial?.approved_at || '')), 'نام تأییدکننده و زمان معتبر لازم است');
    fail(e, Array.isArray(b?.sources) && b.sources.some(s => s.verified === true && validUrl(s.url)?.protocol === 'https:' && isStr(s.claim)), 'حداقل یک شاهد معتبر و تأییدشده برای ادعاهای فنی لازم است');
    fail(e, isStr(b?.image?.hero_url) && ['https:', 'file:'].includes(validUrl(b.image.hero_url)?.protocol) && isStr(b?.image?.alt), 'تصویر مستقل و alt فارسی باید تأیید شود');
    fail(e, Array.isArray(b?.content?.related_links) && b.content.related_links.length > 0, 'حداقل یک لینک داخلی واقعی لازم است');
  }
  return { errors: e, warnings: w };
}

// Conservative HTML snapshot gate, not an HTML validator or indexation proof.
const meta = (html, key, property = false) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const needle = (property ? 'property' : 'name') + '='; const tag = tags.find(t => t.toLowerCase().includes(needle + '"' + key.toLowerCase() + '"') || t.toLowerCase().includes(needle + "'" + key.toLowerCase() + "'"));
  return tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || '';
};
const canonical = html => html.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)?.[1] || '';
const pageText = html => normalize((html.match(/<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)>/i)?.[1] || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' '));
const blocks = html => [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(x => { try { const v=JSON.parse(x[1]);return Array.isArray(v)?v:[v]; } catch {return [];} });
const types = docs => docs.flatMap(d => [d, ...(d['@graph'] || [])]).flatMap(o => o?.['@type'] || []);
export function checkHtml(html, expectedUrl) {
  const e = [], w = [], target = validUrl(expectedUrl);
  fail(e, Boolean(target), 'URL معتبر نیست');
  const h1 = html.match(/<h1\b/gi) || [];
  fail(e, h1.length === 1, 'صفحه باید یک H1 اصلی داشته باشد');
  const c = canonical(html);
  fail(e, Boolean(c && validUrl(c)?.pathname === target?.pathname && validUrl(c)?.hostname === target?.hostname), 'canonical غایب یا نادرست است');
  fail(e, isStr(meta(html, 'description')), 'Meta description وجود ندارد');
  fail(e, isStr(html.match(/<title\b[^>]*>([^<]+)<\/title>/i)?.[1]), 'Title وجود ندارد');
  fail(e, !/\bnoindex\b/i.test(meta(html,'robots')), 'صفحه noindex است');
  fail(e, pageText(html).length >= 220, 'بدنه HTML اولیه مقاله کافی نیست یا فقط پوسته JS است');
  fail(e, isStr(meta(html, 'og:image', true)), 'og:image وجود ندارد');
  const graph = types(blocks(html)).flat();
  fail(e, graph.includes('BlogPosting') || graph.includes('Article'), 'Schema مقاله وجود ندارد');
  fail(e, graph.includes('BreadcrumbList'), 'BreadcrumbList وجود ندارد');
  fail(e, /href=["']\/studio\/upload(?:[?"'#])/i.test(html), 'CTA به مسیر استودیو وجود ندارد');
  const heroUrl = meta(html, 'og:image', true);
  if (heroUrl && !/\.(jpe?g|png|webp|avif)(\?|$)/i.test(heroUrl)) w.push('og:image بهتر است فایل تصویری واقعی JPEG/WebP/PNG/AVIF باشد');
  return { errors:e, warnings:w, image:heroUrl, content:pageText(html), canonical:c };
}
const get = async (url, ua) => {
  const res = await fetch(url,{redirect:'follow',headers:{'User-Agent':ua},signal:AbortSignal.timeout(18000)});
  return {status:res.status, contentType:res.headers.get('content-type')||'', xRobots:res.headers.get('x-robots-tag')||'', html:await res.text()};
};
export async function checkLive(url) {
  const target = validUrl(url); if (!target || target.protocol !== 'https:' || target.hostname !== 'myhoma.ir' || !target.pathname.startsWith('/blog/')) return {errors:['فقط آدرس HTTPS مقاله‌های myhoma.ir/blog پذیرفته می‌شود'],warnings:[]};
  const e=[],w=[]; let primary;
  try {primary=await get(url,'Mozilla/5.0 HomaPublicationCheck/1.0');}catch(err){return{errors:['دسترسی به سایت برقرار نشد: '+err.message],warnings:[]};}
  fail(e,primary.status===200 && /text\/html/.test(primary.contentType),'مقاله باید HTML با HTTP 200 برگرداند');
  fail(e,!/\bnoindex\b/i.test(primary.xRobots),'X-Robots-Tag شامل noindex است');
  const first=checkHtml(primary.html,url);e.push(...first.errors);w.push(...first.warnings);
  for(const ua of ['Googlebot','OAI-SearchBot','bingbot']){
    try{
      const other=await get(url,ua);
      fail(e,other.status===200 && /text\/html/.test(other.contentType),ua+': وضعیت HTTP/HTML نادرست');
      fail(e,!/\bnoindex\b/i.test(other.xRobots),ua+': X-Robots-Tag شامل noindex');
      const same=checkHtml(other.html,url);e.push(...same.errors.map(s=>ua+': '+s));
      fail(e,normalize(same.content)===normalize(first.content) && same.canonical===first.canonical,ua+': متن اصلی یا canonical با مرورگر تفاوت دارد');
    }catch(err){e.push(ua+': درخواست ناموفق '+err.message);}
  }
  if(first.image){
    const imageUrl=validUrl(first.image);
    if(!imageUrl || imageUrl.protocol !== 'https:' || !(imageUrl.hostname === 'myhoma.ir' || imageUrl.hostname.endsWith('.myhoma.ir')) || imageUrl.port) {
      e.push('og:image باید آدرس HTTPS روی دامنه تأییدشده هما باشد؛ از واکشی URL ناشناس خودداری شد');
    } else {
      try {
        const res = await fetch(imageUrl, {method:'GET', signal:AbortSignal.timeout(15000)});
        fail(e, res.ok && /^image\//i.test(res.headers.get('content-type') || ''), 'og:image باید HTTP 200 و MIME تصویر برگرداند');
        await res.body?.cancel();
      } catch(err) { e.push('og:image قابل دریافت نیست: ' + err.message); }
    }
  }
  try {
    const robots = await fetch('https://myhoma.ir/robots.txt',{signal:AbortSignal.timeout(15000)});
    const rules = await robots.text();
    fail(e, robots.status === 200, 'robots.txt باید HTTP 200 باشد');
    fail(e, !/^\s*Disallow:\s*\/blog(?:\/|\s|$)/im.test(rules), 'robots.txt مسیر بلاگ را مسدود می‌کند');
  } catch(err) { e.push('robots.txt قابل بررسی نیست: ' + err.message); }
  try {
    const sitemap = await fetch('https://myhoma.ir/blog/sitemap.xml',{signal:AbortSignal.timeout(15000)});
    const xml = await sitemap.text();
    fail(e, sitemap.status === 200 && xml.includes('<loc>' + url + '</loc>'), 'مقاله باید در Sitemap بلاگ موجود باشد');
  } catch(err) { e.push('Sitemap بلاگ قابل بررسی نیست: ' + err.message); }
  w.push('User-Agent simulation is not verification of real crawler IP/WAF allowlisting or Google indexing.');
  return {errors:e,warnings:w};
}
async function cli() {
  const args=process.argv.slice(2);
  const getArg=n=>{const i=args.indexOf(n);return i<0?null:args[i+1]};
  const approved=args.includes('--approved'); const report=[];
  let files=[];
  if(getArg('--file')) files.push(getArg('--file'));
  if(getArg('--draft-dir')){
    const dir=getArg('--draft-dir');
    try{const names=(await readdir(dir)).filter(x=>x.endsWith('.json'));files.push(...names.map(x=>dir+'/'+x));}catch(err){report.push({label:dir,errors:['پوشه در دسترس نیست: '+err.message],warnings:[]});}
  }
  for(const file of files){
    try{const b=JSON.parse(await readFile(resolve(file),'utf8'));report.push({label:file,...checkBrief(b,approved)});}
    catch(err){report.push({label:file,errors:['JSON نادرست یا فایل ناموجود: '+err.message],warnings:[]});}
  }
  if(getArg('--url'))report.push({label:getArg('--url'),...await checkLive(getArg('--url'))});
  if(!report.length){console.error('Usage: --file <brief.json> [--approved] | --draft-dir <dir> | --url <https://myhoma.ir/blog/slug/>');process.exitCode=2;return;}
  for(const r of report){console.log((r.errors.length?'FAIL':'PASS')+' '+r.label);for(const v of r.errors)console.log('  ERROR '+v);for(const v of r.warnings)console.log('  WARN  '+v);}
  if(report.some(x=>x.errors.length))process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await cli();
