## وضعیت انتشار — 2026-11-12

نسخهٔ نهایی مقاله در https://myhoma.ir/blog/living-room-before-after منتشر و بررسی شد. ورودی انتشار `public/blog/living-room-before-after/index.html` است؛ فایل review قدیمی با noindex برای سابقهٔ بازبینی حفظ شده است. زمان واقعی CMS: `2026-11-12T11:52:25.197425+00:00` (۱۵:۲۲ به وقت تهران). کامیت محتوای منتشرشده: `e4d2992ffeb47a7f8978d98fe6aeac79f1f8c5a1`.

- Sync موجود: published=1، errors=[]؛ فقط worker بلاگ دوباره اجرا شد، بدون تغییر بازهٔ 48ساعته یا Build استودیو.
- API و صفحهٔ مقاله و دو تصویر HTTP 200؛ فهرست دارای 8 مقاله است.
- H1، canonical، robots=index,follow، BlogPosting و BreadcrumbList بررسی شدند؛ محتوای اصلی انسان، Googlebot، OAI-SearchBot و Bingbot یکسان بود.
- هر دو sitemap پاسخ 200 دادند؛ sitemap بلاگ شامل مقاله است. لینک‌های داخلی و مسیر CTA نیز پاسخ 200 دارند.
- راهنمای ایجنت: [docs/BLOG-PUBLISHING.md](https://github.com/Powerostad/HomaFrontend/blob/dev/docs/BLOG-PUBLISHING.md).

این تأیید انتشار مقاله است، نه تأیید عبور همهٔ تست‌های عمومی فرانت یا مجوز Merge تغییرات غیرمحتوایی PR.

---

## یادداشت بازبینی پیش از انتشار (سابقه)

# پیش‌نویس مقاله «قبل و بعد دکوراسیون پذیرایی» — ۲۰ آبان ۱۴۰۵

## موضوع و متمایزسازی

- **نیت اصلی:** «تغییر دکوراسیون پذیرایی بدون تعویض مبل»؛ زیرمجموعه «قبل و بعد دکوراسیون پذیرایی».
- **هدف خواننده:** تصمیم درباره حفظ/جابه‌جایی/بهبود/خرید بدون فهرست خرید بی‌دلیل.
- **وجه تمایز:** تحلیل دقیق دو عکس ارسالی، جدول موارد حفظ‌شده و تغییرکرده، و اولویت انجام تغییرها؛ نه بازنویسی راهنمای عمومی نور یا فرش.
- حجم جست‌وجو، رقابت کلمه، آمار کلیک و وضعیت ایندکس با داده واقعی تأیید نشده‌اند.

## فایل‌های خروجی

- `article.html` — متن کامل، عنوان/متا، پاسخ مستقیم، قبل و بعد، جدول تصمیم، CTA، لینک‌های داخلی و BlogPosting/BreadcrumbList.
- `../../drafts/living-room-before-after.json` — بریف و شواهد قابل بررسی؛ وضعیت `draft` و بدون نام تأییدکننده.
- `../../../public/blog/images/living-room-before-after/` — چهار JPEG واقعی (قبل/بعد × دسکتاپ/موبایل). تصاویر در مخزن ذخیره شده‌اند؛ وجودشان روی دامنه زنده هنوز اثبات نشده است.

## منبع تصاویر و احتیاط درباره واقعیت

دو تصویر توسط کاربر در گفتگو ارائه شده‌اند. نسخه‌های JPEG با تغییر اندازه و فشرده‌سازی از همین دو تصویر ساخته شده‌اند. این تصاویر برای تحلیل **مقایسه تصویری** استفاده شده‌اند. ادعای اجرای واقعی، رضایت مشتری، مقدار هزینه یا افزایش اندازه فضا وجود ندارد. منشأ اولیه/اجازه انتشار نهایی تصاویر باید در مرحله بازبینی داخلی تأیید شود.

## تحقیق کوتاه

منابع مطالعه‌شده:

- فارسی: [چطور بدون تعویض مبلمان حال‌وهوای نشیمن را عوض کنیم؟](https://seemorgh.com/lifestyle/decoration/decorating-questions/481497-refresh-living-room-without-replacing-furniture/) — جهت تشخیص محتوای رایج و جلوگیری از تکرار عمومی.
- فارسی: [راهنمای چیدمان و نورپردازی پذیرایی](https://khonenama.ir/magazine/living-room-zoning-lighting-guide) — زمینه و نیاز جست‌وجو.
- تخصصی: [IKEA — Making the most of your living room lighting](https://www.ikea.com/in/en/rooms/living-room/how-to/making-the-most-of-your-living-room-lighting-pub1c4dd8a0/) — نقش نور عمومی و موضعی.
- فنی: [Google Search Central — Article schema](https://developers.google.com/search/docs/appearance/structured-data/article) و [Image SEO](https://developers.google.com/search/docs/appearance/google-images).

این بررسی SERP کیفی است، نه اندازه‌گیری Search Volume و Keyword Difficulty. هم‌پوشانی دقیق با همه ۷ مقاله زنده باید در CMS/Search Console بررسی و توسط بازبین ثبت شود.

## کنترل کیفیت و مرحله انتشار

**وضعیت فعلی: تأیید محتوایی توسط درخواست‌کننده در ۱۲ نوامبر ۲۰۲۶ ثبت شده؛ همچنان بدون مجوز انتشار خودکار.**

شاهد ثبت تأیید: [کامنت PR شماره ۱۶](https://github.com/Powerostad/HomaFrontend/pull/16#issuecomment-6808526065). این تأیید از گفتگو ثبت شده و به معنی احراز هویت سردبیر در CMS، بررسی همه مطالب زنده، عبور کامل Gate یا Publish نیست. بریف وضعیت `approved` دارد، اما `topic_overlap_checked` و `originality_checked` هنوز تکمیل نشده‌اند؛ مقاله در پوشه Review و دارای `noindex` باقی می‌ماند.

```bash
node scripts/blog-review-qa.mjs
```

این تست فقط وجود و صحت پایه فایل‌های Draft را کنترل می‌کند. استاندارد کامل انتشار در [PR 12](https://github.com/Powerostad/HomaFrontend/pull/12) شامل تأیید سردبیر، تطبیق محتوای تأییدشده با هش و بررسی HTTP زنده است. با `--approved` در حال حاضر باید Block شود.

پیش از انتشار واقعی:

1. تأیید محتوایی ثبت شده است؛ با این حال، هویت ناشر در CMS، مجوز نهایی تصویر و هم‌پوشانی با تمام مقالات زنده باید مستقل تأیید شوند.
2. نسخه HTML از حالت Preview با `noindex` به قالب فعال بلاگ تبدیل شود. متای `datePublished` و `dateModified` **بر اساس تاریخ واقعی انتشار** تنظیم شوند، نه تاریخ تهیه Draft.
3. فایل‌های JPEG در مسیر عمومی در دسترس باشند؛ URLهای لینک داخلی بررسی شوند و محتوا از سرویس واقعی `blog-http/public-documents` و Sync معتبر منتشر شود. صرف Merge یا PR به معنی Publish نیست.
4. HTTP 200 تصویر و مقاله، H1، canonical، BlogPosting، BreadcrumbList، robots، دو Sitemap و پاسخ یکسان انسان و Googlebot/OAI-SearchBot/Bingbot روی دامنه بررسی شود.
5. `article_view`، `studio_cta_click` و شروع واقعی استودیو از طریق سیستم آنالیتیکس بلاگ پس از اتصال بررسی شود.

خروجی این PR به داده خصوصی محصول، API فروشنده و موتور طراحی دست نمی‌زند.
