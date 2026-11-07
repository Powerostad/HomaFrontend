import { createServer } from 'node:http';
export async function startFixture() {
  const category = {slug:'curtains',title:'پرده',description:'راهنمای پرده'};
  const post = {slug:'release-test',title:'مقالهٔ آزمون انتشار',excerpt:'متن اختصاصی مقاله',body:'## انتخاب پرده\n\nمتن اختصاصی آزمون انتشار.',category,author_name:'تحریریه هما',published_at:'2026-11-01T00:00:00Z',updated_at:'2026-11-02T00:00:00Z',reading_minutes:2,cover_url:'',cover_alt:'',seo_title:'مقالهٔ آزمون انتشار',meta_description:'راهنمای آزمون'};
  const server=createServer((req,res)=>{
    const path=new URL(req.url,'http://fixture').pathname;
    let data;
    if(path==='/api/blog/posts/release-test/') data={kind:'article',post,related:[]};
    else if(path==='/api/blog/posts/') data={kind:'index',posts:[post],categories:[category],category:null,page:1,count:1,has_next:false};
    else if(path==='/api/blog/sitemap/') data={posts:[post]};
    else {res.writeHead(404);res.end('{}');return;}
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({success:true,data}));
  });
  await new Promise(done=>server.listen(0,'0.0.0.0',done));return server;
}
