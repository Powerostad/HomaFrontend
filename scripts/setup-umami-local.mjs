// Local-only installation; does not change production or expose default credentials.
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const directory = process.argv[2];
if (!directory) throw new Error('Provide an absolute private directory outside the repository');
const privateDir = resolve(directory);
const repo = resolve('.');
if (privateDir === repo || privateDir.startsWith(repo + '/') || privateDir.startsWith(repo + '\\')) throw new Error('Credentials must stay outside the repository');
await mkdir(privateDir, { recursive: true });
const filename = join(privateDir, 'umami-local.json');
let credentials;
try { credentials = JSON.parse(await readFile(filename, 'utf8')); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
  credentials = { username: 'homa-admin', password: randomBytes(24).toString('base64url'), dbPassword: randomBytes(24).toString('hex'),
    appSecret: randomBytes(32).toString('hex'), twoFactorKey: randomBytes(32).toString('hex') };
  await writeFile(filename, JSON.stringify(credentials, null, 2), { mode: 0o600 });
}
const envFile = join(privateDir, 'umami-local.env');
await writeFile(envFile, `UMAMI_DB_PASSWORD=${credentials.dbPassword}\nUMAMI_APP_SECRET=${credentials.appSecret}\nUMAMI_2FA_KEY=${credentials.twoFactorKey}\n`, { mode: 0o600 });
const compose = ['compose', '-p', 'homa-analytics-local', '--env-file', envFile, '-f', 'ops/analytics/compose.yml', '-f', 'ops/analytics/compose.local.yml'];
const up = spawnSync('docker', [...compose, 'up', '-d', '--wait', '--wait-timeout', '240'], { stdio: 'inherit' });
if (up.status !== 0) throw new Error('Local Umami did not become healthy');
const base = 'http://127.0.0.1:8788';
async function request(path, body, token) {
  const response = await fetch(base + '/api/' + path, { method: 'POST', signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Local analytics bootstrap HTTP ${response.status}`);
  return response.json();
}
let login;
if (!credentials.initialized) {
  const initial = await request('auth/login', { username: 'admin', password: 'umami' });
  await request('users/' + initial.user.id, { username: credentials.username, password: credentials.password }, initial.token);
  credentials.initialized = true;
  await writeFile(filename, JSON.stringify(credentials, null, 2), { mode: 0o600 });
}
login = await request('auth/login', { username: credentials.username, password: credentials.password });
if (!credentials.websiteId) {
  const website = await request('websites', { name: 'Homa local funnel QA', domain: 'localhost' }, login.token);
  credentials.websiteId = website.id;
}
if (!credentials.funnelId) {
  const funnel = await request(`websites/${credentials.websiteId}/funnels`, {
    name: 'Blog → Design',
    description: 'Onsite only: article view → CTA → accepted processing. Search queries remain separate aggregates.',
    parameters: { window: 30, steps: ['article_view', 'studio_cta_click', 'studio_processing_started'].map(value => ({ type: 'event', value })) },
  }, login.token);
  credentials.funnelId = funnel.id;
}
credentials.reportingToken = login.token;
await writeFile(filename, JSON.stringify(credentials, null, 2), { mode: 0o600 });
console.log(`Local analytics ready: ${base}\nPrivate credentials: ${filename}\nProduction unchanged.`);
