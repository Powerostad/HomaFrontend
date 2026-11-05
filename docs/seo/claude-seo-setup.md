# Claude SEO برای HomaFrontend

**هدف:** استفاده از ابزار [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) برای تحقیق موضوعات، ممیزی فنی و کنترل کیفیت مقاله‌های فارسی بلاگ هما.

این ابزار یک **پلاگین Claude Code** است و جزئی از React/Vite، فرایند Build، سایت عمومی یا ChatGPT Automations نیست. افزودن `.claude/settings.json` تنها پلاگین را به محیط Claude Code پروژه معرفی و فعال می‌کند؛ **نصب واقعی روی دستگاه و آماده‌سازی Python/Chromium هنوز باید توسط اجراکننده Claude Code انجام و تأیید شود.**

## وضعیت و پیش‌نیاز

- منبع: `AgriciDaniel/claude-seo` (پلاگین MIT، نسخه بررسی‌شده در زمان افزودن: `2.5.0`).
- Claude Code نسخه `1.0.33+`، Python `3.11–3.14` و Git.
- فعال‌بودن یک محیط Claude Code متصل به حساب Anthropic.
- برای تحلیل صفحات مبتنی بر JS، مرورگر headless پس از `/seo setup` نصب می‌شود.
- **هیچ API key** یا credential را به Git commit نکنید.
- تنظیم `autoUpdate: false` برای کاهش خطر آپدیت خودکار گذاشته شده است. پیش از آپدیت نسخه/تغییر upstream را بازبینی کنید.

## نصب و تأیید در Claude Code

در ریشه ریپازیتوری `HomaFrontend`، Claude Code را اجرا کنید و پس از تأیید اعتماد به پوشه، این دستورات را در **خود Claude Code** وارد کنید (نه در shell یا ChatGPT):

```text
/plugin marketplace add AgriciDaniel/claude-seo
/plugin install claude-seo@agricidaniel-claude-seo
/seo setup
/seo doctor
```

اگر marketplace از `.claude/settings.json` شناخته شده باشد، دستور اول ممکن است لازم نباشد. برای اطمینان، نتیجه `/seo doctor` و سپس `/seo` را بررسی کنید. اگر پلاگین خودکار نصب نشد، دستور `/plugin install` را صریح اجرا کنید. تنظیمات پروژه ممکن است بسته به نسخه CLI یا در محیط Claude Code cloud به‌تنهایی نصب را تکمیل نکنند.

نصب پلاگین به `package.json`، فایل‌های production و سرور Nginx تغییری نمی‌دهد. اجرای `/seo setup` یک محیط مجزای Python و مرورگر مورد نیاز را در محیط اجرای Claude Code آماده می‌کند.

## اولین بررسی‌های هما

```text
/seo audit https://myhoma.ir/blog/
/seo technical https://myhoma.ir/blog/
/seo page https://myhoma.ir/blog/
/seo images https://myhoma.ir/blog/
/seo content-brief پرده مناسب پذیرایی مستطیلی
/seo cluster چیدمان پذیرایی مستطیلی
```

برای مقاله منتشرشده، دستور `/seo page` را با URL واقعی آن اجرا کنید. در صورت داشتن مالکیت Search Console، `/seo google setup` را **فقط داخل محیط مطمئن خود** انجام دهید. صرف وجود ابزار به معنی دسترسی به حجم جست‌وجوی ایرانی، داده Search Console یا رتبه‌های گوگل نیست.

## روند انتشار مقاله فارسی هما

1. **موضوع:** یک مسئله/سؤال مشخص مخاطب ایرانی و یک نیت جست‌وجوی واحد؛ از تکرار مقاله‌های قبلی خودداری کنید.
2. **تحقیق:** بررسی نتایج جست‌وجوی فارسی، سؤال‌های پرتکرار و اعتبار ادعاها. حجم جست‌وجو، Keyword Difficulty و CTR را بدون داده واقعی اعلام نکنید.
3. **Brief:** از `/seo content-brief` یا `/seo cluster` به‌عنوان ورودی پژوهش استفاده کنید؛ خروجی را با اصطلاحات رایج ایران مثل «مبل ال»، «فرش ۹ متری»، «پرده پانچ» تنظیم کنید.
4. **نوشتن:** پاسخ مفید در ابتدای مقاله، H1 واحد، H2های نیت‌محور، جدول/مثال کاربردی، لینک داخلی توصیفی و CTA طبیعی متناسب با مسئله کاربر. از پرکردن متن، تکرار مصنوعی واژه و الزام طول ثابت خودداری کنید.
5. **تصویر:** عکس یا نمودار واقعیِ مرتبط با مقاله، alt فارسی، مسیر فایل مستقل و تست بارگذاری HTTP؛ محتوای تصویرسازی با AI را به‌عنوان تصویر پروژه واقعی مشتری معرفی نکنید.
6. **کنترل فنی:** Title و meta description یکتا، canonical صحیح، BlogPosting JSON-LD مطابق محتوای قابل‌مشاهده، robots/sitemap، سرعت و موبایل. برای سایت JS مطمئن شوید Googlebot محتوای درست مقاله را دریافت می‌کند.
7. **استقرار و سنجش:** PR مستقل، بررسی و Build، سپس تست URL زنده و عکس‌ها. بعد از انتشار، عملکرد واقعی را در Search Console با Query، Impression، CTR و Index Coverage پایش کنید.

**معیار پذیرش:** یک مقاله خوب لزوماً بلند نیست؛ باید تصمیم واقعی کاربر را آسان‌تر کند و در صفحه منتشرشده بدون خطای خزش، تصویر یا عنوان ارائه شود.

## مرزهای استفاده و امنیت

- این ریپو third-party است. دستورات پلاگین، زیرعامل‌ها و اسکریپت‌ها را پیش از دادن کلیدهای Search Console یا دسترسی به سرور بررسی کنید.
- ابزار audit برای گزارش است، نه مجوز تغییر خودکار روی سایت یا ارسال داده به APIهای پولی.
- از گزینه‌های افزونه مثل DataForSEO/Ahrefs/Firecrawl فقط پس از بررسی هزینه و مجوز استفاده کنید.
- نصب در Claude Code باعث فعال شدن دستورات `/seo` در ChatGPT یا اتوماسیون‌های فعلی ChatGPT نمی‌شود؛ آن جریان باید جداگانه یکپارچه شود.

### حذف

در Claude Code:

```text
/plugin uninstall claude-seo@agricidaniel-claude-seo
```

پس از حذف، برای جلوگیری از معرفی مجدد، در صورت نیاز تنظیمات `.claude/settings.json` را هم در یک PR اصلاح کنید.

منابع: [نصب رسمی](https://github.com/AgriciDaniel/claude-seo/blob/main/docs/INSTALLATION.md)، [مستندات تنظیمات پروژه Claude Code](https://code.claude.com/docs/en/settings)، [مخزن و مجوز](https://github.com/AgriciDaniel/claude-seo).
