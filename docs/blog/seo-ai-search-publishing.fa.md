# استاندارد انتشار مقاله‌های هما برای SEO و AI Search — v1

**دامنه:** مقالات جدید فارسی برای کاربران داخل ایران؛ مسیر `/blog/`، بدون تغییر موتور طراحی یا بازکردن کاتالوگ خصوصی.

**مبنای تصمیم:** هما از محتوا برای رساندن کاربر از «نمی‌دانم برای خانه‌ام چه انتخابی مناسب است» به «درک مسئله و شروع بررسی فضای واقعی» استفاده می‌کند. معیار موفقیت، تولید تعداد زیادی مقاله یا تعداد کلمه نیست؛ پاسخ کاربردی، دریافت ورودی مرتبط و شروع واقعی طراحی است.

## قرارداد انتشار

| مرحله | خروجی | شرط عبور |
|---|---|---|
| ۱. Research | پرسش اصلی، نیت جست‌وجو، نتیجه بررسی SERP فارسی، مقالات نزدیک موجود | مسئله مشخص و تکراری نبودن موضوع با بازبینی انسانی |
| ۲. Brief | پاسخ کوتاه، چارچوب H2، نقاط تصمیم، منابع ادعا، ارتباط با خوشه | مشخص بودن چیزی که کاربر بعد از خواندن می‌تواند تصمیم بگیرد |
| ۳. Draft | متن، تصاویر، title/description، لینک داخلی، CTA، منابع | هیچ ادعای ساختگی یا خرید غیرضروری؛ تصاویر AI با برچسب درست |
| ۴. Review | بررسی فنی/محتوایی و تأیید انسان | تأیید صریح قبل از Sync و publication؛ `approved_by` و `approved_at` واقعی |
| ۵. Publish | URL واقعی و نسخه محتوایی همگام‌شده | انتشار فقط از مسیر واقعی production blog؛ هیچ ادعایی بر اساس وجود PR به‌تنهایی |
| ۶. Verify | بررسی HTTP واقعی، Googlebot، OAI-SearchBot، Bingbot، 404، تصاویر، canonical، schema | پاسخ ۲۰۰ متنِ اصلی و تصویر؛ عدم تفاوت محتوای عمومی بین user agents |
| ۷. Measure | GSC + Umami + Bing Webmaster، با ثبت تاریخ و کشور | پیگیری index، Query، ورودی، `article_view`، `studio_cta_click` و شروع واقعی طراحی |

**توجه:** خط CI قدیمی `seo-http-check` مربوط به مسیر SSR قدیمی است و هنوز با Production هم‌راستا نیست. این راهنما جایگزین رفع آن خطا نیست؛ برای مقالات جدید کنترل کیفی اضافه می‌کند.

## قالب محتوای پیشنهادی

- یک هدف جست‌وجوی اصلی برای هر مقاله: نمونه «پرده مناسب مبل کرم و پذیرایی کم‌نور».
- سؤال کاربر در H1 و پاسخ مستقیم و مشروط در ابتدای بدنه؛ از قطعیت غیرقابل دفاع پرهیز شود.
- ۳ تا ۶ تیتر H2 مفید؛ جدول مقایسه/معیار اندازه‌گیری فقط اگر کمک واقعی به تصمیم کند.
- عبارت‌های متداول کاربران ایران: «پرده پانچ»، «مبل ال»، «فرش ۶ متری»، «پذیرایی مستطیلی». متن طبیعی، بدون Keyword Stuffing.
- هر ادعای فنی، عدد، استاندارد یا مقایسه مهم باید شاهد معتبر یا توضیح روش داشته باشد. برای توصیه‌های سلیقه‌ای، شرط‌ها و محدودیت‌ها توضیح داده شود.
- یک لینک به راهنمای موضوعی یا مقاله مکمل **واقعاً موجود**، و یک CTA طبیعی `/studio/upload`. لینک ساختگی به صفحه‌ای که هنوز منتشر نشده ممنوع.
- برای تصاویر اختصاصی: فایل JPEG/WebP واقعی و alt فارسی؛ تصاویر AI را تصویرسازی بنامید، نه پروژه اجراشده مشتری.
- `datePublished` تاریخ انتشار واقعی، `dateModified` زمان تغییر معنادار؛ برای ایجاد تازگی ظاهری تاریخ را عوض نکنید.
- عنوان، توضیح متا و H1 توصیفی باشند؛ تعداد کلمه الزام الگوریتمی نیست و معیار انتشار نیست.

## قابلیت استناد توسط AI Search

پیش از هر مقاله این پنج سؤال را پاسخ دهید:

1. **Answerable:** آیا پاسخ کوتاه، مستقل از مقدمه، قابل فهم و مشروط به وضعیت فضاست؟
2. **Evidence:** آیا ادعای قابل بررسی با منبع یا روش معتبر همراه است؟ آیا استفاده از نمونه واقعی قابل اثبات است؟
3. **Specificity:** آیا مقاله چیزی بیشتر از توصیه عمومی دارد (مثال مقیاس، شرط تصمیم، مقایسه)؟
4. **Discoverability:** آیا صفحه HTML اولیه، canonical، لینک داخلی، تصویر و robots مناسبی دارد؟
5. **Trust:** آیا تیم تحریریه، نحوه تولید و بازبینی و وضعیت تصویر AI شفاف است؟

برای Google AI Overviews/AI Mode **Schema خاص GEO وجود ندارد** و Google نیاز به `llms.txt` تعیین نکرده است. `BlogPosting`، `BreadcrumbList` و داده‌های مطابق با متن صفحه از قبل کافی‌اند؛ فقط وقتی درست هستند اضافه شوند.

برای ChatGPT Search در robots و CDN/WAF دسترسی `OAI-SearchBot` را بررسی کنید. `GPTBot` وظیفه متفاوتی دارد و اجازه یا عدم اجازه به آن را جداگانه تصمیم بگیرید. برای Gemini Search باید indexability و دسترسی `Googlebot` درست باشد؛ برای Bing/Copilot نیز Bingbot و Bing Webmaster را بررسی کنید. تست صرفاً با User-Agent واقعی بودن IP خزنده را اثبات نمی‌کند.

**ممنوع:** نمایش محتوای متفاوت به خزنده و کاربر، ساختگی‌کردن تجربه مشتری، وعده رتبه گرفتن، تولید انبوه FAQ بدون نیاز واقعی، مخفی‌کردن اطلاعات فروشنده/محصول از انسان و ارائه فقط به خزنده.

## ساختار رکورد مقاله در مخزن

رکورد پیش‌نویس در `content/blog/drafts/*.json` است؛ نمونه در `docs/blog/article-brief.example.json`. این رکورد **منبع انتشار مستقیم فعلی سایت نیست**؛ نقش آن ثبت Brief، شواهد و تأیید است. برای هر مقاله جدید، ابتدا این رکورد را بسازید و Quality Gate را اجرا کنید.

```bash
node scripts/blog-ai-seo-gate.mjs --draft-dir content/blog/drafts
node scripts/blog-ai-seo-gate.mjs --file content/blog/drafts/your-slug.json
# پس از تأیید سردبیر:
node scripts/blog-ai-seo-gate.mjs --file content/blog/drafts/your-slug.json --approved
# پس از انتشار، از محیطی که به myhoma.ir دسترسی دارد:
node scripts/blog-ai-seo-gate.mjs --url https://myhoma.ir/blog/your-slug/
```

**زنجیره واقعی Sync/Publish:** گزارش ۷ نوامبر نشان می‌دهد انتشار از مخزن/شاخه‌های محتوا به دیتابیس بلاگ و سپس سرویس زنده منتقل می‌شود. این کد کامل در `dev` موجود نیست؛ پس فعلاً اتصال `approved → published` را اعمال نمی‌کنیم. تا زمان دسترسی به منبع واقعی Sync، انتشار از این رکورد صرفاً **فرایند دستی/مستقل** است. ادغام کور PRهای قدیمی ممنوع.

## Analytics و بازخورد

- Umami باید در صفحه بلاگ **و بعد از کلیک CTA** قابل ثبت باشد؛ `article_view` / `studio_cta_click` با `article_slug`؛ بدون IP، محتوای عکس کاربر یا Query خصوصی.
- `studio_processing_started` از مسیر استودیو معیار شروع واقعی است، نه صرف کلیک CTA.
- Search Console داده Query را در سطح گزارش و صفحه می‌دهد، نه الزاماً هر Session؛ نسبت دادن Query فردی به تبدیل بدون داده معتبر غلط است.
- برای Copilot، گزارش AI Performance در Bing Webmaster در صورت اتصال حساب مبناست. برای ChatGPT ارجاعات قابل تشخیص از referrer/UTM را جدا پایش کنید؛ نبود referrer به معنی نبود نمایش نیست.
- هر ماه موضوعات تازه را با Queryهای واقعی، میزان کلیک و شروع طراحی بازاولویت‌بندی کنید. برای بازار ایران حجم جست‌وجو یا سختی کلمه را بدون ابزار اندازه‌گیری اعلام نکنید.

## مراجع رسمی
- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google: helpful content Who, How, Why](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [OpenAI: Publisher FAQ / OAI-SearchBot](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
- [Bing Webmaster: AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)

## اتصال عملی به واردکننده (مرحله فعلی)

برای جلوگیری از انتشار ناخواسته، علاوه بر بریف، یک **Publication Preflight** قابل فراخوانی از CMS اضافه شده است: `scripts/blog-publish-preflight.mjs`. مستندات نگاشت payload، قفل‌کردن revision، هش نسخه تأییدشده، نتیجه رد/قبول و وضعیت اتصال به سرویس واقعی در `docs/blog/production-sync-contract.fa.md` قرار دارد.

```bash
node --test scripts/blog-ai-seo-gate.test.mjs scripts/blog-publish-preflight.test.mjs
node scripts/blog-publish-preflight.mjs --file /path/to/normalized-publication.json --json
```

بدون اتصال واقعی این مرحله در تراکنش انتشار CMS، اجرای ابزار در GitHub جلوی Sync خارج از گیت‌هاب را نمی‌گیرد. همچنین `approved_by` باید از لاگ احراز هویت سرور بیاید و فقط وجود متن در JSON احراز هویت نیست. `published` را برای این رکوردهای جانبی به معنی تأیید روی سایت تلقی نکنید.
