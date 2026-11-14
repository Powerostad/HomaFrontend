/**
 * Homepage-specific decision explainer. Text and links are ordinary HTML so
 * readers, assistive technology and crawlers can understand the same message.
 * No catalog data or unverifiable customer success claims are exposed.
 */
export function HomeDecisionSection() {
  return (
    <section
      className="w-full bg-surface-default px-6 py-20 md:py-28 border-t border-black/[0.04]"
      aria-labelledby="homa-decision-title"
    >
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <p className="text-[11px] tracking-wider text-foreground/50 mb-5">از مسئله خانه تا تصمیم بهتر</p>
          <h2 id="homa-decision-title" className="text-[28px] md:text-[42px] leading-[1.5] font-light text-foreground mb-6">
            قبل از خرید، بفهم چه چیزی واقعاً باید تغییر کند.
          </h2>
          <p className="text-[15px] md:text-[17px] font-light leading-[2] text-foreground/70">
            هما فقط تصویر یک دکور جدید نمی‌سازد. از عکس فضای خودت شروع می‌کنی تا تغییرهای ممکن را بررسی کنی:
            چه چیزی بهتر است بماند، چه چیزی جابه‌جا شود و کجا یک محصول تازه می‌تواند به فضای تو کمک کند.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 border-y border-black/10 py-10 md:py-14">
          <li>
            <span className="block text-[13px] text-foreground/40 mb-4" aria-hidden="true">۰۱</span>
            <h3 className="text-[19px] font-normal text-foreground mb-3">عکس فضای خودت</h3>
            <p className="text-[14px] font-light leading-[1.95] text-foreground/65">
              یک تصویر از پذیرایی یا اتاق خوابت ارسال کن تا پیشنهادها بر اساس همان فضای موجود شکل بگیرند.
            </p>
          </li>
          <li>
            <span className="block text-[13px] text-foreground/40 mb-4" aria-hidden="true">۰۲</span>
            <h3 className="text-[19px] font-normal text-foreground mb-3">بررسی تغییرها</h3>
            <p className="text-[14px] font-light leading-[1.95] text-foreground/65">
              ببین چه وسایلی را می‌توان حفظ یا جابه‌جا کرد و کدام تغییرها برای هماهنگی فضا مناسب‌ترند.
            </p>
          </li>
          <li>
            <span className="block text-[13px] text-foreground/40 mb-4" aria-hidden="true">۰۳</span>
            <h3 className="text-[19px] font-normal text-foreground mb-3">تصمیم برای خرید</h3>
            <p className="text-[14px] font-light leading-[1.95] text-foreground/65">
              اگر خرید لازم بود، گزینه‌های متناسب با طراحی را بررسی کن؛ قرار نیست هر وسیله‌ای تعویض شود.
            </p>
          </li>
        </ol>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
          <a href="/studio/upload" className="inline-flex items-center justify-center min-h-[48px] bg-black text-white px-8 text-[13px] hover:bg-black/90 transition-colors">
            بررسی فضای من در هما
          </a>
          <a href="/blog/" className="inline-flex items-center min-h-[44px] text-[13px] underline underline-offset-4 text-foreground/70 hover:text-foreground transition-colors">
            راهنماهای فرش، پرده، چیدمان و تغییر دکوراسیون
          </a>
        </div>
      </div>
    </section>
  );
}
