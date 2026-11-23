# بریف سردبیری: آباژور رومیزی کنار مبل چه ارتفاعی داشته باشد؟

وضعیت: صرفاً بازبینی؛ بدون درخواست صریح انتشار.

## سند مقدم
docs/BLOG-PUBLISHING.md در شاخه dev خوانده شد. HTML در content/blog/review و شاخه draft است؛ هیچ ورودی در public/blog ساخته نشده است. Sync فقط بعد از درخواست صریح انتشار و انتقال به content/blog-* مجاز است.

## موضوع و نیت
پرسش اصلی «آباژور کنار مبل چه ارتفاعی باشد که نور توی چشم نزند؟»؛ نیت informational/problem-solving با تصمیم خرید. پاسخ بر سنجش لبه پایین کلاهک از محل نشستن و مقایسه با میز عسلی است، نه عدد ثابت قد چراغ.

## SERP و منابع
- https://www.furnitureinfashion.net/blog/how-tall-should-table-lamps-be-next-to-a-sofa/amp/ — لبه شید نزدیک چشم نشسته.
- https://www.kotrohome.com/guides/table-lamp-size-guide — ارتفاع میز، کلاهک و نور.
- https://sittingroomguide.com/table-lamp-height-sofa — نشان می‌دهد قواعد «قد کل» و «لبه شید» می‌توانند با هم ناسازگار شوند؛ آزمون نشستن مقدم است.
در نتایج بررسی‌شده منابع فارسی دقیقِ همین پرسش کمتر از راهنماهای کلی نورپردازی بودند؛ این نتیجه به معنی اندازه‌گیری حجم جست‌وجو نیست. Search Volume و رتبه: داده معتبر نداریم و ادعا نشده.

## جلوگیری از تکرار
شاخه‌های content/blog-* بررسی شدند: فرش، نورپردازی کلی، میز جلو مبلی، اتاق خواب، آینه، رادیاتور و قبل/بعد. موضوع حاضر به جای «نورپردازی کلی» روی تناسب ارتفاع شید، میز و چشم فرد نشسته تمرکز دارد. لینک داخلی /blog/ عمومی است؛ پیش از انتشار باید روی سایت زنده تأیید شود. /blog/ در ابزار وب این نوبت باز نشد.

## ساختار
پاسخ مستقیم در پاراگراف نخست، ۵ H2، جدول عیب‌یابی، مثال ۱۰۵−۵۵=۵۰ سانتی‌متر، FAQ، CTA /studio/upload، canonical و meta. هیچ آمار رتبه یا تجربه مشتری جعلی نیست.

## تصویر
تصویر مفهومی اختصاصی تولید و به JPEG واقعی ۱۵۳۶×۱۰۲۴ با حجم ۲۵۲۱۸۴ بایت تبدیل شد؛ مسیر محلی /mnt/data/homa-table-lamp-sofa-cover.jpg. اتصال GitHub فعلی ابزار انتقال باینری از container به Git tree ندارد. تا پیش از انتقال فایل به public/blog/images/table-lamp-height-beside-sofa/cover.jpg در شاخه انتشار، src و og:image فقط مقصد برنامه‌ریزی‌شده هستند؛ این پیش‌نویس نباید وارد Sync شود.

## پیش‌نیازهای انتشار
درخواست صریح کاربر؛ بازبینی لینک داخلی و منابع؛ قرار دادن تصویر واقعی در همان Git tree؛ آزمون apps/blog/github_content.py::parse_article در محیط Sync اگر در دسترس؛ انتقال HTML بدون تغییر معنایی به public/blog/table-lamp-height-beside-sofa/index.html در شاخه content/blog-table-lamp-height-beside-sofa-YYYYMMDD. سپس Sync و کنترل API، HTML انسان/Googlebot، canonical، robots، schema CMS، تصاویر /api/blog/assets، sitemap و CTA. هیچ انتشار یا تاریخ نشر ادعا نشده است.
