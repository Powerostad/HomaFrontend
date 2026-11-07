# قرارداد اتصال دروازه انتشار بلاگ هما به CMS / Sync

## هدف و مرز اجرا

این سند برای اتصال `scripts/blog-publish-preflight.mjs` به **مسیر واقعی انتشار بلاگ** است. تا زمانی که سورس فعال `blog-http/public-documents` و سرویس Sync در محیط در دسترس قرار نگیرد، اتصال اجرایی اعمال نشده است. اسکریپت جدید **فقط بررسی می‌کند**؛ هیچ DB write، انتشار، rollback یا تماس با API انجام نمی‌دهد.

از ۷ نوامبر ۲۰۲۶، بررسی زنده کاربر وجود ۷ مقاله، دو Sitemap و سرویس فعال بلاگ را تأیید کرده است. بدین ترتیب GitHub `Powerostad/HomaFrontend/dev` به‌تنهایی مرجع نسخه زنده نیست. تغییر در PRهای قدیمی، تغییر موتور طراحی یا بازکردن داده خصوصی محصولات، راه‌حل انتشار بلاگ نیست.

## مرز داده: payload نرمال‌شده

نقطه اتصال Sync باید **قبل از تغییر status به published** یک payload بسازد. کلیدهای الزامی:

```json
{
  "schema_version": "homa-blog-publication-v1",
  "brief": {
    "schema_version": "homa-blog-brief-v1",
    "status": "approved",
    "slug": "example-slug"
  },
  "article": {
    "slug": "example-slug",
    "title": "عنوان مقاله",
    "seo_title": "عنوان سئو",
    "meta_description": "توضیح متا",
    "canonical": "https://myhoma.ir/blog/example-slug/",
    "body_html": "<p>متن مقاله...</p>",
    "hero_image_url": "https://myhoma.ir/blog/images/example.webp",
    "hero_alt": "توضیح تصویری مرتبط",
    "related_links": [{"href": "/blog/", "anchor": "مجله هما"}]
  },
  "approval": {
    "approved_by": "شناسه بازبین تأییدشده در CMS",
    "approved_at": "2026-11-07T12:00:00+03:30",
    "review_reference": "شناسه ثبت تأیید در CMS",
    "reviewed_sha256": "هش ۶۴کاراکتری محتوای تأییدشده"
  }
}
```

این فقط **شمای فیلدها** است، نه payload آماده عبور از کنترل: `brief` باید همه فیلدهای کامل مثال `docs/blog/article-brief.example.json`، شواهد تأییدشده، بررسی هم‌پوشانی و داده بازبینی واقعی را داشته باشد.

هش محتوا از فیلدهای محدود و مشخص مقاله ساخته می‌شود (در فایل اسکریپت، `contentDigest(article)`). پیوند هش به approval اجازه نمی‌دهد متنی که بعد از تأیید ویرایش شده بدون بازبینی جدید منتشر شود.

## اتصال پیشنهادی در Sync

1. رکورد Draft را ایجاد و در آن موضوع، منابع، تصاویر و متن را ذخیره کنید.
2. بازبین احرازشده در **سیستم خودتان** نسخه نهایی مقاله را ببیند و آن را approve کند. ثبت `approved_by` و `review_reference` باید از هویت معتبر CMS انجام شود؛ نه از یک فایل خوداظهاری یا توکن در اختیار نویسنده.
3. نسخه بازبینی‌شده را قفل/نسخه‌بندی و `reviewed_sha256` را از محتوای نهایی محاسبه کنید.
4. پیش از هر Sync یا انتشار، payload را از نسخه ذخیره‌شده و approval معتبر بسازید؛ سپس دروازه را اجرا کنید.
5. اگر خروجی nonzero بود، عملیات انتشار را **متوقف کنید** و مقاله را در وضعیت Draft/Review نگه دارید. اجازه fallback به published داده نشود.
6. فقط در مسیر سالم، رکورد را با transaction یا optimistic lock به published تغییر دهید و revision و audit log را نگه دارید. محتوای منتشرشده باید دقیقاً همان revision تأییدشده باشد.
7. بعد از استقرار، URL را از محیطی که به دامنه دسترسی واقعی دارد بررسی کنید و خطا را برای بازبین گزارش کنید. موفقیت چک HTTP **به معنی ایندکس یا حضور در ChatGPT/Gemini نیست**.

**نمونه اجرای آفلاین:**

```bash
node --test scripts/blog-ai-seo-gate.test.mjs scripts/blog-publish-preflight.test.mjs
node scripts/blog-publish-preflight.mjs --file path/to/normalized-payload.json --json
# کد خروجی ۰ = عبور ساختاری؛ کد ۱ = خطای محتوا/تأیید؛ کد ۲ = فایل نامعتبر
node scripts/blog-ai-seo-gate.mjs --url https://myhoma.ir/blog/existing-slug/
```

**نکات امنیتی:** اعتبارسنجی JSON جایگزین احراز هویت سردبیر، کنترل مجوز publish، قفل نسخه، CSRF، Sanitizer HTML در سرور یا جلوگیری از SSRF نیست. اسکریپت preflight هیچ URL خارجی را fetch نمی‌کند و فقط داده ساختاری را بررسی می‌کند. کنترل LIVE تصاویر را فقط روی دامنه تأییدشده هما درخواست می‌کند.

## ماتریس سناریوهای ممنوع

| سناریو | نتیجه مورد انتظار |
|---|---|
| Article Draft یا Reviewed | Reject |
| `approved_by` یا شناسه review نامعتبر/غایب | Reject |
| محتوای مقاله پس از approval تغییر کند | Reject |
| تصویر نسبت به بریف تغییر کند | Reject |
| canonical خارج از آدرس مقاله | Reject |
| URL تصویر خارج از دامنه هما | Reject |
| منابع مهم تأیید نشده باشند | Reject |
| HTML اجرایی داخل متن | Reject؛ Sanitize واقعی همچنان لازم است |
| تمام کنترل‌ها عبور کنند | فقط مجوز ادامه در CMS؛ هنوز **انتشار خودکار** نیست |

## موارد باز تا ادغام واقعی

- محل و commit/container دقیق سرویس Sync و renderer بلاگ؛ با اطلاعات فعلی صرفاً از روی گزارش زنده شناخته شده، نه در `dev`.
- نگاشت مدل داده آن سرویس به payload بالا؛ انتشار باید از یک منبع authoritative انجام شود.
- احراز هویت و ذخیره reviewer approval در سمت سرور، نه با فیلد قابل ویرایش نویسنده.
- تست End-to-End روی staging با یک مقاله Draft، یک مقاله تأییدشده و یک مقاله اصلاح‌شده بعد از approval.
- تست واقعی راه‌یابی و دریافت تصویر، robots، Sitemap، پاسخ کاربر/Googlebot/OAI-SearchBot/Bingbot؛ در نهایت پایش Index/Search Console و تبدیل.
- CI قدیمی `seo-http-check` همچنان ناسازگار با artifact فعلی است؛ این تغییر آن را مخفی یا حذف نمی‌کند.
