# بریف سردبیری — tv-sofa-viewing-distance

**وضعیت:** برای بازبینی؛ درخواست انتشار دریافت نشده. هیچ محتوایی در public قرار نگیرد.

**پرسش هدف:** «فاصله مبل تا تلویزیون ۵۵ و ۶۵ اینچ چقدر باید باشد؟»
**نیت:** محاسبه فاصله واقعی در خانه ایرانی، انتخاب سایز تلویزیون و چیدمان مبل. Search Volume/رتبه: داده واقعی در دسترس نیست و گزارش نمی‌شود.

**بررسی موضوع‌های موجود:** docs/BLOG-PUBLISHING.md از dev خوانده شد. شاخه‌های content/blog-* شامل پرده، فرش، نور، میز جلو مبلی، قبل/بعد پذیرایی، اتاق خواب، آینه، لغزش فرش و فاصله مبل از شوفاژ بررسی شدند؛ این پرسش مستقل است. PRهای قبلی #17، #20، #21 و #22 نیز بررسی شدند.

**SERP فارسی:** جست‌وجوهای «فاصله تلویزیون تا مبل ۵۵ اینچ ۶۵ اینچ» و «سایز مناسب تلویزیون» صفحات زیر را نشان دادند:
- https://www.samsung.com/iran/tvs/tv-buying-guide/what-size-tv-should-i-get/
- https://viewmag.ir/how-do-we-choose-the-right-tv-size/
- https://mahdemobleiran.ir/مجله/ابعاد-استاندارد-مبل-و-فاصله-گذاری-در-پذیرایی-راهنمای-عددی-چیدمان
تمایز: تفکیک زاویه دید ۳۰ و ۴۰ درجه از فاصله تشخیص پیکسل، مثال ۳۰۰-۱۰-۴۰، جدول و نکات مبل ال.

**منابع فنی معتبر:** https://www.rtings.com/tv/reviews/by-size/size-to-distance-relationship ؛ https://www.samsung.com/iran/tvs/tv-buying-guide/what-size-tv-should-i-get/ ؛ https://www.sony.com/electronics/support/televisions-projectors-oled-tvs-android-/k-55xr80c/articles/00008601

**لینک داخلی:** /blog/coffee-table-size-shape ؛ نیازمند تست HTTP واقعی پیش از انتشار. CTA /studio/upload.

**تصویر:** تصویرسازی اختصاصی JPEG با ابعاد 1536×1024 و حجم 363882 بایت در محیط اجرا تولید شد. فایل محلی /mnt/data/homa-tv-distance-cover.jpg؛ برای انتشار باید فایل باینری واقعی در public/blog/images/tv-sofa-viewing-distance/cover.jpg در همان شاخه content قرار بگیرد. تا آن زمان src و og:image در HTML صرفاً مسیر مقصدند. تصویر پروژه واقعی نیست.

**کنترل‌ها:** بررسی صفحه زنده /blog/ با ابزار وب موفق نشد؛ نمی‌توان فهرست زنده را قطعی دانست. parser apps/blog/github_content.py::parse_article در محیط Sync اجرا نشده. این پیش‌نویس ورودی Sync نیست؛ پس از تأیید صریح کاربر، تصویر و HTML در شاخه content اختصاصی قرار گیرند و parser و API/HTML/schema/assets/sitemap/CTA آزموده شوند.