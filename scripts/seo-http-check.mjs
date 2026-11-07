// Tests the actual production document router, or Nginx container with --image.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, copyFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';
import { startFixture } from './release-fixture.mjs';
import { verifyBlogAnalyticsBundle } from './blog-performance/verify-bundle.mjs';

const image=process.argv.includes('--image') ? process.argv[process.argv.indexOf('--image')+1] : null;
const fixture=await startFixture();
const fixturePort=fixture.address().port;
const temporary=await mkdtemp(join(tmpdir(),'homa-release-'));
const report={architecture:'nginx-public-documents-blog-v1',mode:image?'image':'router',checks:[],image};
let child,container;
const docker=args=>execFileSync('docker',args,{encoding:'utf8',timeout:60000}).trim();
try {
  report.blogAnalytics = await verifyBlogAnalyticsBundle();
  let base;
  if(image) {
    for(const path of ['/blog-analytics.js','/config.js']) {
      const response=await fetch(base+path);
      assert.equal(response.status,200,path+' served');
      assert(/javascript/.test(response.headers.get('content-type')||''),path+' JavaScript MIME');
      assert(!/immutable/.test(response.headers.get('cache-control')||''),path+' revalidates');
    }
    const probe=createServer();await new Promise(done=>probe.listen(0,'127.0.0.1',done));
    const port=probe.address().port;await new Promise(done=>probe.close(done));
    const args=['run','-d','--name',`homa-contract-${process.pid}`,'-p',`127.0.0.1:${port}:80`,'-e','SITE_URL=https://myhoma.ir','-e',`BLOG_API_URL=http://host.docker.internal:${fixturePort}/api/blog`];
    if(process.platform==='linux') args.push('--add-host','host.docker.internal:host-gateway');
    container=docker([...args,image]);
    base=`http://127.0.0.1:${port}`;
    report.imageId=docker(['inspect','--format','{{.Image}}',container]);
  } else {
    for(const path of ['render-bot.mjs','blog-http.mjs','public-documents.mjs']) await copyFile(path,join(temporary,path));
    await copyFile('dist-blog-server/blog-render.mjs',join(temporary,'blog-render.mjs'));
    const probe=createServer();await new Promise(done=>probe.listen(0,'127.0.0.1',done));
    const port=probe.address().port;await new Promise(done=>probe.close(done));
    child=spawn(process.execPath,[join(temporary,'render-bot.mjs')],{env:{...process.env,RENDER_BOT_HTML:resolve('dist/index.html'),RENDER_BOT_PORT:String(port),SITE_URL:'https://myhoma.ir',BLOG_API_URL:`http://127.0.0.1:${fixturePort}/api/blog`},stdio:['ignore','pipe','pipe']});
    child.stderr.on('data',chunk=>process.stderr.write(chunk));base=`http://127.0.0.1:${port}`;
  }
  let ready=false;
  for(let n=0;n<80;n++) {
    try {if((await fetch(base+'/',{signal:AbortSignal.timeout(500)})).ok){ready=true;break;}} catch { /* Wait for real process readiness. */ }
    await new Promise(done=>setTimeout(done,250));
  }
  assert(ready,'Production document service did not become ready');
  if(image) {
    const metadataResponse=await fetch(base+'/build-info.json');
    assert.equal(metadataResponse.status,200);
    const metadata=await metadataResponse.json();
    assert.equal(metadata.contract,report.architecture);
    assert.match(metadata.sourceSha256,/^[a-f0-9]{64}$/);
    assert.equal(metadata.revision,docker(['inspect','--format','{{index .Config.Labels "org.opencontainers.image.revision"}}',container]));
    report.provenance=metadata;
  }
  const cases=[['/',200,true],['/blog',200,true],['/blog/release-test',200,true],['/blog/missing-release-test',404,false],['/missing-release-test',404,false],['/studio/upload',200,false],['/studio/chat/existing-session',200,false]];
  for(const [path,status,indexable] of cases) {
    const bodies=[];
    for(const agent of ['Mozilla/5.0 HomaReleaseCheck','Googlebot']) {
      const res=await fetch(base+path,{headers:{'User-Agent':agent},redirect:'manual'});const html=await res.text();
      assert.equal(res.status,status,path+' status');
      if(!indexable) assert(/noindex/i.test(res.headers.get('x-robots-tag')||html),path+' noindex');
      if(indexable) {
        assert(/<h1[\s>]/i.test(html),path+' H1');
        assert(html.includes(`href="https://myhoma.ir${path==='/'?'/':path}"`),path+' canonical');
        assert(!/noindex/i.test(res.headers.get('x-robots-tag')||''),path+' indexable');
      }
      if(path==='/blog/release-test') {
        assert(html.includes('data-article-path="/blog/release-test"'));
        assert(html.includes('src="/blog-analytics.js"'));
        assert(html.includes('متن اختصاصی آزمون انتشار.'));
        assert(html.includes('BlogPosting'));assert(html.includes('BreadcrumbList'));
        assert(!html.includes('هُما؛ نسخه‌یِ بهترِ خونه‌ت.'));
      }
      bodies.push(html);
    }
    assert.equal(bodies[0],bodies[1],path+' human/bot HTML parity');
    report.checks.push({path,status,indexable,humanBotParity:true});
  }
  if(image) {
    for(const path of ['/robots.txt','/sitemap.xml','/blog/sitemap.xml']) {
      const res=await fetch(base+path);const body=await res.text();assert.equal(res.status,200,path);
      assert(!body.includes('<!doctype'),path+' must not return SPA');
      if(path==='/sitemap.xml') assert(!body.includes('/studio/'));
      if(path==='/blog/sitemap.xml') assert(body.includes('/blog/release-test'));
      report.checks.push({path,status:res.status});
    }
    assert.equal((await fetch(base+'/store/hidden')).status,404);
  }
  report.status='passed';console.log(JSON.stringify(report,null,2));
} catch(error) {
  report.status='failed';report.error=String(error);
  if(container) console.error(docker(['logs',container]));
  throw error;
} finally {
  if(child){const exited=new Promise(done=>child.once('exit',done));child.kill();await exited;}
  if(container) docker(['rm','-f',container]);
  await new Promise(done=>fixture.close(done));await rm(temporary,{recursive:true,force:true});
  await mkdir('reports/seo-ci',{recursive:true});await writeFile('reports/seo-ci/release-contract.json',JSON.stringify(report,null,2));
}
