#!/usr/bin/env node
// Draft-only check; this is not editorial approval or a production publish gate.
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function checkDraft(root = process.cwd(), slug = 'living-room-before-after') {
 const problems = [], notes = [];
 const articlePath = join(root, 'content/blog/review', slug, 'article.html');
 const briefPath = join(root, 'content/blog/drafts', slug + '.json');
 const [html, brief] = await Promise.all([
   readFile(articlePath,'utf8'),readFile(briefPath,'utf8').then(JSON.parse)
 ]);
 const eq = (condition, message) => { if (!condition) problems.push(message); };
 eq(['draft','reviewed','approved'].includes(brief.status), 'Unknown editorial status');
 eq(brief.schema_version === 'homa-blog-brief-v1', 'Unexpected brief schema');
 eq(brief.slug === slug, 'Brief slug mismatch');
 eq(brief.search?.topic_overlap_checked === false, 'Topic overlap not fully verified; do not mark checked automatically');
 if(brief.status === 'approved') {
   eq(brief.editorial?.approval_source === 'chatgpt_conversation', 'Recorded approval source missing');
   eq(brief.editorial?.approval_reference === 'https://github.com/Powerostad/HomaFrontend/pull/16#issuecomment-6808526065', 'Approval reference is missing or changed');
   eq(Boolean(brief.editorial?.approved_by) && Boolean(brief.editorial?.approved_at), 'Editorial approval timestamp or attribution missing');
   notes.push("Editorial approval is recorded from the requester's chat, NOT an authenticated GitHub/CMS approval or a release authorization.");
 } else {
   eq(!brief.editorial?.approved_by && !brief.editorial?.approved_at, 'Unapproved content cannot contain approval metadata');
 }
 eq(brief.content?.cta?.href === '/studio/upload', 'Studio CTA missing from brief');
 eq((html.match(/<h1\b/g)||[]).length === 1, 'Expected exactly one H1');
 eq((html.match(/<h2\b/g)||[]).length >= 3, 'Missing descriptive H2s');
 eq(html.includes('<title>'+brief.seo.title+'</title>'), 'SEO title mismatch');
 eq(html.includes('content="'+brief.seo.description+'"'), 'Meta description mismatch');
 eq(html.includes('rel="canonical" href="'+brief.seo.canonical+'"'), 'Canonical mismatch');
 eq(html.includes('name="robots" content="noindex,follow"'), 'Review HTML must be noindex');
 eq(html.includes('href="/studio/upload"'), 'Missing visible Studio CTA');
 eq(html.includes('قبل') && html.includes('بعد'), 'Before/after comparison missing');
 eq(html.includes('srcset='), 'Missing responsive image markup');
 eq(html.includes('BlogPosting') && html.includes('BreadcrumbList'), 'Structured data missing');
 const tags = [...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]);
 eq(tags.length===2, 'Expected both user-provided comparison photographs');
 eq(tags.every(tag=>/alt="[^"]+"/.test(tag) && /\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag)), 'Images need descriptive alt and dimensions');
 const ld = [...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
 try { eq(ld.length === 1 && JSON.parse(ld[0][1])['@graph'].length>=2, 'JSON-LD incomplete'); } catch { problems.push('JSON-LD malformed'); }
 const imageFiles = ['before-1080.jpg','before-560.jpg','after-735.jpg','after-480.jpg'];
 for (const name of imageFiles) {
   const file=join(root,'public/blog/images',slug,name);
   try { const b=await readFile(file);eq(b.length>10000 && b[0]===0xff && b[1]===0xd8 && b[b.length-2]===0xff && b[b.length-1]===0xd9,'Invalid JPEG '+name); }
   catch(err){problems.push('Missing image '+name+': '+err.message);}
 }
 eq(Array.isArray(brief.sources)&&brief.sources.length>=2,'Missing research references');
 notes.push('PASS means review-package structure is valid; it does not authorize publication in the live CMS.');
 notes.push('Live CMS sync, actual publication date, working internal links, image URLs and indexability remain unverified.');
 return {ok:problems.length===0,slug,problems,notes};
}
if(process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 try {const result=await checkDraft();console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
 catch(err){console.error(err);process.exitCode=1;}
}
