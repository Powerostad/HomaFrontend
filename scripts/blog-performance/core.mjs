export const TIMEZONE = 'America/Los_Angeles';
export const EVENTS = ['article_view', 'studio_cta_click', 'studio_processing_started'];

export function articlePath(value, origin = 'https://myhoma.ir') {
  const url = new URL(value, origin);
  if (url.origin !== new URL(origin).origin) return null;
  const path = url.pathname.replace(/\/$/, '');
  return /^\/blog\/[^/]+$/.test(path) ? path : null;
}

export function dates(start, end) {
  for (const day of [start, end]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day).toISOString().slice(0, 10) !== day) throw new Error('Invalid date');
  }
  if (end < start) throw new Error('End date precedes start date');
  const result = [];
  for (let d = new Date(start); d <= new Date(end); d.setUTCDate(d.getUTCDate() + 1)) result.push(d.toISOString().slice(0, 10));
  if (result.length > 93) throw new Error('Maximum report window is 93 days');
  return result;
}

/** GSC uses Pacific calendar days, including DST changes. */
export function dayBounds(day) {
  const midnight = Date.parse(day + 'T00:00:00Z');
  const localMidnight = (instant) => {
    let candidate = instant;
    for (let i = 0; i < 3; i++) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      }).formatToParts(candidate).map(p => [p.type, p.value]));
      const local = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
      candidate += instant - local;
    }
    return candidate;
  };
  return { startAt: localMidnight(midnight), endAt: localMidnight(midnight + 86400000) - 1 };
}

export function aggregateReport(snapshot) {
  if (snapshot.timezone !== TIMEZONE) throw new Error('Both sources must use Pacific calendar dates');
  const allowed = new Set(dates(snapshot.start, snapshot.end));
  const cells = new Map();
  const cell = (path, date, device) => {
    if (!allowed.has(date) || !['mobile', 'desktop', 'tablet', 'unknown'].includes(device)) throw new Error('Invalid report dimension');
    const key = JSON.stringify([path, date, device]);
    if (!cells.has(key)) cells.set(key, { article_path: path, date, device,
      google_clicks: null, google_impressions: null,
      article_view: snapshot.umami === null ? null : 0, studio_cta_click: snapshot.umami === null ? null : 0,
      studio_processing_started: snapshot.umami === null ? null : 0 });
    return cells.get(key);
  };
  for (const row of snapshot.gsc?.rows || []) {
    const [date, page, device] = row.keys;
    const path = articlePath(page);
    if (!path) continue;
    const c = cell(path, date, device.toLowerCase());
    if (![row.clicks, row.impressions].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid search count');
    c.google_clicks = (c.google_clicks ?? 0) + row.clicks; c.google_impressions = (c.google_impressions ?? 0) + row.impressions;
  }
  for (const row of snapshot.umami?.rows || []) {
    const path = articlePath(row.article_path);
    if (!path || !EVENTS.includes(row.event)) throw new Error('Invalid editorial event');
    if (!Number.isSafeInteger(row.count) || row.count < 0) throw new Error('Invalid event count');
    cell(path, row.date, row.device)[row.event] += row.count;
  }
  const rows = [...cells.values()].sort((a, b) => a.article_path.localeCompare(b.article_path) || a.date.localeCompare(b.date) || a.device.localeCompare(b.device));
  for (const row of rows) {
    row.search_ctr = row.google_impressions ? row.google_clicks / row.google_impressions : null;
    row.cta_per_view = row.article_view ? row.studio_cta_click / row.article_view : null;
    row.starts_per_cta = row.studio_cta_click ? row.studio_processing_started / row.studio_cta_click : null;
  }
  // Query rows remain editorial search data. Never expand these against onsite events.
  const queries = (snapshot.gsc?.queries || []).flatMap(row => {
    const [date, page, device, query] = row.keys;
    const path = articlePath(page);
    return path ? [{ date, article_path: path, device: device.toLowerCase(), query, clicks: row.clicks, impressions: row.impressions }] : [];
  });
  const summaries = new Map();
  for (const row of rows) {
    const key = JSON.stringify([row.article_path, row.device]);
    const summary = summaries.get(key) || { article_path: row.article_path, device: row.device,
      google_clicks: null, google_impressions: null, article_view: null, studio_cta_click: null, studio_processing_started: null };
    for (const field of ['google_clicks', 'google_impressions', ...EVENTS]) {
      if (row[field] !== null) summary[field] = (summary[field] ?? 0) + row[field];
    }
    summaries.set(key, summary);
  }
  return { start: snapshot.start, end: snapshot.end, timezone: TIMEZONE,
    example: snapshot.example === true,
    sources: { gsc: snapshot.gsc !== null, umami: snapshot.umami !== null }, summaries: [...summaries.values()], rows, queries,
    notes: ['Event counts, not unique-person conversion rates.', 'Onsite events cover all channels; Google clicks are a separate aggregate.',
      'Starts use event date and last explicit article CTA within 30 minutes in the same tab. Window boundaries can split the journey.',
      'Search Console may omit anonymized/top-limited query rows. Query totals are not page totals.',
      'Missing source or missing search row = null, not zero. Tracking blockers and closed tabs can undercount.'] };
}

const escape = value => String(value ?? '—').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function renderReport(report) {
  const metrics = [
    ['google_impressions', 'نمایش در گوگل'], ['google_clicks', 'کلیک گوگل'],
    ['article_view', 'مشاهده مقاله'], ['studio_cta_click', 'کلیک شروع'],
    ['studio_processing_started', 'شروع واقعی'],
  ];
  const table = (rows, columns) => `<div class="scroll"><table><thead><tr>
    ${columns.map(([, label]) => `<th scope="col">${label}</th>`).join('')}
    </tr></thead><tbody>${rows.map(row => `<tr>${columns.map(([key]) => `<td>${escape(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>عملکرد مقالات هما</title>
<style>
:root{--content:#1c1c1a;--border:#e9e9e6;--surface:#faf9f6}
body{font-family:Vazirmatn,Tahoma,sans-serif;max-width:1300px;margin:32px auto;padding:16px;color:var(--content)}
table{border-collapse:collapse;width:100%;margin:20px 0}td,th{padding:12px;border:1px solid var(--border);text-align:right}
th{background:var(--surface)}.scroll{overflow:auto}p{line-height:1.9}summary{cursor:pointer;padding:12px 0}
</style></head><body><main>
<h1>عملکرد مقالات هما</h1>
${report.example ? '<p><strong>آزمایش لوکال؛ این اعداد آمار کاربران سایت نیستند.</strong></p>' : ''}
<p>${escape(report.start)} تا ${escape(report.end)} · ${TIMEZONE}</p>
<p>Search Console: ${report.sources.gsc ? 'دادهٔ گزارش دریافت شده' : 'داده دریافت نشده'} · Umami: ${report.sources.umami ? 'دادهٔ گزارش دریافت شده' : 'داده دریافت نشده'}</p>
<p>آمار سرچ و رفتار سایت، در سطح مقاله، روز و دستگاه کنار هم آمده‌اند. کلیک شروع طراحی، تبدیل نیست؛ ستون آخر فقط شروع تأییدشدهٔ پردازش را نشان می‌دهد.
اعداد تعداد رویداد هستند، نه تعداد کاربران یکتا. رفتار داخل سایت همهٔ کانال‌ها را شامل می‌شود و نرخ تبدیل مختص گوگل از آن محاسبه نمی‌شود.</p>
${table(report.summaries, [['article_path','مقاله'],['device','دستگاه'], ...metrics])}
<details><summary>جزئیات روزانه</summary>
${table(report.rows, [['article_path','مقاله'],['date','روز'],['device','دستگاه'], ...metrics])}
</details>
<h2>عبارت‌های جست‌وجو؛ مستقل از رفتار افراد</h2>
${table(report.queries, [['article_path','مقاله'],['date','روز'],['device','دستگاه'],['query','Query'],['impressions','نمایش'],['clicks','کلیک']])}
<p>اطلاعات Query ممکن است به‌دلیل محدودیت حریم خصوصی و سقف داده‌های گوگل کامل نباشد. روزها براساس زمان Pacific هستند.
شروع طراحی با آخرین کلیک مقاله در همان تب و تا ۳۰ دقیقه مرتبط می‌شود؛ عبور از نیمه‌شب یا مرز گزارش می‌تواند مراحل را در روزهای متفاوت ثبت کند.
خط تیره یعنی منبع یا ردیف سرچ دریافت نشده؛ صفر یعنی در داده‌های دریافت‌شده رویدادی ثبت نشده است. این فایل برای استفادهٔ داخلی است.</p>
</main></body></html>`;
}
