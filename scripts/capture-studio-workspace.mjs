/** Local, read-only visual fixture. All API/AI requests are blocked.
 * Usage: node scripts/capture-studio-workspace.mjs <absolute-playwright-package-path>
 * Run Vite on 127.0.0.1:5181 first. Screenshots are ignored under reports/.
 * No authentication bypass or fixture is included in the application bundle.
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || 'playwright');
const origin = 'http://127.0.0.1:5181';
const image = '/images/studio/example-good.webp';
const document = { user_facing_summary: { main_improvement_idea: 'نور نرم‌تر، فضای آرام‌تر', positive_diagnosis: 'نور طبیعی و بافت گرم، نقطهٔ قوت این فضاست. وسایل اصلی را حفظ می‌کنیم و با چند تغییر محدود، اتاق را هماهنگ‌تر می‌کنیم.', top_changes: ['نور مکمل کنار مبل', 'بازتر شدن مسیر رفت‌وآمد'], why_these_changes_work: 'نور چندلایه عمق بیشتری به فضا می‌دهد و چیدمان ساده‌تر، مسیر عبور را روشن نگه می‌دارد.', expected_visual_result: 'فضایی صمیمی و روشن‌تر، با حفظ هویت خانه.', shopping_message: 'پیشنهادهای خرید را جدا از تغییرات بدون هزینه ببین.' } };
const execution = { studio_documents: { scene: document }, purchases: [{ item_id: 'lamp', quantity: 1, category: 'چراغ ایستاده', reason_fa: 'یک لایهٔ نور گرم برای گوشهٔ نشیمن.', placement_instruction_fa: 'کنار مبل، خارج از مسیر رفت‌وآمد.', relation: 'similar', product: { product_id: 123, name: 'چراغ ایستاده با نور گرم — نمونهٔ نمایشی', price_toman: 2500000, merchant_name: 'کاتالوگ نمونه', image_url: '/images/studio/preset-warm-living.webp', description: 'دادهٔ نمایشی برای بررسی چیدمان؛ محصول واقعی نیست.' }, alternatives: [] }], free_actions: [{ instruction_fa: 'مسیر عبور کنار مبل را باز نگه دار.', reason_fa: 'دسترسی راحت‌تر به پنجره و نشیمن.' }], surface_actions: [], known_subtotal_rial: 25000000, unknown_cost_item_ids: [], budget_status: 'within', budget_ceiling_toman: null };
const messages = [{ id: 'u', role: 'user', text: 'می‌خواهم فضا گرم‌تر شود، اما مبل‌ها و فرش بمانند.' }, { id: 'a', role: 'assistant', text: 'حتماً. وسایل اصلی را حفظ می‌کنیم. پیشنهاد من اضافه کردن نور نرم کنار مبل و مرتب کردن مسیر عبور است.\n\n**گام بعدی**\nراهنمای طراحی و پیشنهادهای محصول را در تب‌های بالا ببین؛ هر تغییری خواستی همین‌جا بگو.' }];
const fixture = `import React from '/node_modules/.vite/deps/react.js'; const useState=React.useState;
const version={version_id:'fixture-v1',image_url:${JSON.stringify(image)},execution:${JSON.stringify(execution)}};
export function useRedesignChat(path){const [viewedId,selectVersion]=useState('fixture-v1');return {sessionId:path||null,messages:${JSON.stringify(messages)},chipGroups:[],versions:path?[version]:[],viewedId,selectVersion,selectedVersion:viewedId==='fixture-v1'?version:undefined,originalImage:path?${JSON.stringify(image)}:null,busy:false,hydrating:false,unavailable:false,error:null,status:'idle',sendTurn:async()=>false,selectChip:()=>{},retry:()=>{},newVersionReady:false};}`;
const auth = `export const AuthProvider=({children})=>children; export const useAuth=()=>({user:{id:'visual-fixture',name:'نمونهٔ نمایشی'},isLoggedIn:true,isInitialized:true,isLoading:false,login:()=>{},logout:()=>{},getAccessToken:()=>null}); export const useAuthLegacy=useAuth;`;
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-proxy-server'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/src/context/AuthContext.tsx') return route.fulfill({ contentType: 'application/javascript', body: auth });
    if (url.pathname === '/src/pages/RoomRedesign/hooks/useRedesignChat.ts') return route.fulfill({ contentType: 'application/javascript', body: fixture });
    if (url.origin !== origin && /\.(woff2?|ttf)$/.test(url.pathname)) {
      try { return route.fulfill({ contentType: 'font/woff2', body: execFileSync('curl.exe', ['-sS', '--max-time', '10', url.href], { maxBuffer: 5000000 }) }); } catch { return route.abort(); }
    }
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/') || url.origin !== origin) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => console.error('Page error:', error.message));
  async function capture(name) {
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll('img').forEach(image => image.loading = 'eager'); });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); }))));
    await page.screenshot({ path: `reports/studio-design/${name}.png`, fullPage: true });
    console.log(name, JSON.stringify(await page.evaluate(() => ({ width: innerWidth, contentWidth: document.documentElement.scrollWidth, composers: document.querySelectorAll('#studio-message').length }))));
  }
  await page.goto(`${origin}/studio?lang=fa`, { waitUntil: 'domcontentloaded' }); await page.locator('.studio-photo-drop').waitFor();
  await capture('entry-desktop-fa');
  await page.setViewportSize({ width: 320, height: 900 }); await capture('entry-mobile-fa');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('input[type=file]').first().setInputFiles('public/images/studio/example-good.webp');
  await page.locator('.studio-brief').waitFor(); await capture('brief-desktop-fa');
  await page.goto(`${origin}/studio/chat/visual-fixture?lang=fa`, { waitUntil: 'domcontentloaded' }); await page.locator('#studio-message').waitFor(); await capture('workspace-desktop-fa');
  await page.getByRole('tab').nth(1).click(); await capture('guide-desktop-fa');
  await page.getByRole('tab').nth(2).click(); await capture('products-desktop-fa');
  await page.setViewportSize({ width: 320, height: 900 }); await capture('products-mobile-fa');
  await page.getByRole('tab').first().click(); await capture('workspace-mobile-fa');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${origin}/studio/chat/visual-fixture?lang=en`, { waitUntil: 'domcontentloaded' }); await page.locator('#studio-message').waitFor(); await capture('workspace-desktop-en');
  await page.goto(`${origin}/studio/upload?lang=fa`, { waitUntil: 'domcontentloaded' }); await page.locator('main').waitFor(); await capture('nonchat-studio-reference');
  await context.close();
} finally { await browser.close(); }
