import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config=JSON.parse(await readFile('config/build.production.json','utf8'));
const allowed=['VITE_API_BASE_URL','VITE_AUTH_MODE','VITE_ENABLE_REALTIME','VITE_IMAGE_FIRST_ENABLED'];
if(Object.keys(config).some(key=>!allowed.includes(key))) throw new Error('Unexpected public build setting');
for(const script of ['node_modules/typescript/bin/tsc','node_modules/vite/bin/vite.js']) {
  const args=script.includes('/vite/')?[script,'build']:[script];
  const result=spawnSync(process.execPath,args,{env:{...config,...process.env},stdio:'inherit'});
  if(result.status!==0) process.exit(result.status||1);
}
