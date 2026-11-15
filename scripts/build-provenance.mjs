import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = {};
async function collect(path) {
  for(const entry of await readdir(path,{withFileTypes:true})) {
    const file=join(path,entry.name);
    if(entry.isDirectory()) await collect(file);
    else if(entry.isFile() && !file.endsWith('.md')) inputs[file.replaceAll('\\','/')]=sha(await readFile(file));
  }
}
for(const root of ['src','public','scripts']) await collect(root);
for(const file of ['config/build.production.json','package.json','package-lock.json','Dockerfile','nginx.conf','render-bot.mjs','blog-http.mjs','public-documents.mjs','docker-entrypoint.sh','render-bot-entrypoint.sh','vite.config.ts','postcss.config.js','tsconfig.json']) inputs[file]=sha(await readFile(file));
let revision=process.env.SOURCE_REV;
if(!revision) {try {revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();} catch {revision='unversioned';}}
const sorted=Object.fromEntries(Object.entries(inputs).sort(([a],[b])=>a.localeCompare(b,'en')));
const info={contract:'nginx-public-documents-blog-v1',revision,sourceSha256:sha(JSON.stringify(sorted)),inputs:sorted};
await mkdir('dist-build-provenance',{recursive:true});
await writeFile('dist-build-provenance/source-manifest.json',JSON.stringify(info,null,2));
const {inputs: _inputs, ...publicInfo}=info;
await writeFile('dist/build-info.json',JSON.stringify(publicInfo,null,2));
console.log('BUILD_PROVENANCE '+info.revision+' '+info.sourceSha256);
