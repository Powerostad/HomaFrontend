import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkPublication, contentDigest } from './blog-publish-preflight.mjs';

const template = JSON.parse(await readFile(new URL('../docs/blog/article-brief.example.json',import.meta.url),'utf8'));

function ready(){
  const brief=structuredClone(template);
  brief.status='approved';
  brief.search.topic_overlap_checked=true;
  brief.search.iran_serp_review='نتایج جست‌وجوی فارسی و مقاله‌های نزدیک بررسی شد؛ مسئله انتخاب جنس پرده است.';
  brief.sources=[{url:'https://www.yourhome.gov.au/energy/lighting',claim:'نقش نور طبیعی در فضا',verified:true}];
  brief.image.hero_url='https://myhoma.ir/blog/images/example-curtain.jpg';
  brief.image.alt='پرده شیری در اتاق روشن';
  brief.editorial={author:'تحریریه هما',fact_checked:true,originality_checked:true,image_checked:true,approved_by:'editor@example.test',approved_at:'2026-11-07T12:00:00+03:30'};
  const article={
    slug:brief.slug,title:brief.title,seo_title:brief.seo.title,meta_description:brief.seo.description,canonical:brief.seo.canonical,
    body_html:'<p>'+('برای انتخاب پرده در پذیرایی باید میزان نور، حریم خصوصی، ابعاد پنجره و رنگ مبل را در نظر گرفت. ').repeat(8)+'</p><h2>مقایسه دو انتخاب</h2>',
    hero_image_url:brief.image.hero_url,hero_alt:brief.image.alt,related_links:structuredClone(brief.content.related_links)
  };
  const approval={approved_by:brief.editorial.approved_by,approved_at:brief.editorial.approved_at,review_reference:'CMS-approval-123',reviewed_sha256:contentDigest(article)};
  return {schema_version:'homa-blog-publication-v1',brief,article,approval};
}

test('A genuinely approved, unchanged normalized payload is structurally ready',()=>{
  const payload=ready();assert.deepEqual(checkPublication(payload).errors,[]);
});

test('Drafts never pass publication preflight',()=>{
  const payload=ready();payload.brief.status='draft';
  assert.ok(checkPublication(payload).errors.some(x=>/status|approved/.test(x)));
});

test('Changing body after approval invalidates its content digest',()=>{
  const payload=ready();payload.article.body_html+=' <p>محتوای اضافه بعد از تأیید.</p>';
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('هش')));
});

test('Unverified factual claims cannot pass approved editorial gate',()=>{
  const payload=ready();payload.brief.sources=[{url:'https://example.org',claim:'ادعای فنی',verified:false}];
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('شاهد')));
});

test('Publisher must not silently swap the hero image',()=>{
  const payload=ready();payload.article.hero_image_url='https://myhoma.ir/blog/images/another.jpg';
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('تصویر')));
});

test('External canonical or untrusted image is rejected',()=>{
  const payload=ready();payload.article.canonical='https://other.example/blog/page/';
  payload.article.hero_image_url='https://attacker.example/picture.jpg';
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('canonical')));
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('myhoma.ir')));
});

test('Executable HTML is refused even if its digest is updated',()=>{
  const payload=ready();payload.article.body_html+='<script>alert(1)</script>';payload.approval.reviewed_sha256=contentDigest(payload.article);
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('ناامن')));
});

test('Missing reviewer evidence cannot be bypassed by a plausible content hash',()=>{
  const payload=ready();payload.approval.review_reference='';
  assert.ok(checkPublication(payload).errors.some(x=>x.includes('شناسه')));
});
