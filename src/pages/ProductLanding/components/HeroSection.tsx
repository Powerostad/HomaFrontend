import { Link } from 'react-router-dom';
import { BeforeAfterSlider } from "../../../components/BeforeAfterSlider";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * One semantic H1 and one crawlable Studio link across all viewport sizes.
 * The same visible message is shown to people and search engines.
 * OptimizedImage inside BeforeAfterSlider selects the existing responsive WebPs.
 */
export function HeroSection({ onGetStarted }: { onGetStarted?: () => void }) {
    const { t } = useTranslation();

    return (
        <section className="relative w-full bg-surface-default overflow-hidden md:h-screen md:min-h-[660px]" aria-labelledby="homa-home-title">
            {/* The image slider is shared by mobile and desktop: no duplicate LCP images. */}
            <div className="relative w-full aspect-[6/5] max-h-[42svh] md:max-h-none md:aspect-auto md:absolute md:top-0 md:end-0 md:w-[65%] md:h-full">
                <BeforeAfterSlider
                    beforeImage="/images/hero/before.png"
                    afterImage="/images/hero/after.png"
                    className="w-full h-full object-cover"
                    priority
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-surface-default via-surface-default/60 to-transparent pointer-events-none z-10 md:inset-y-0 md:start-0 md:end-auto md:bottom-auto md:w-64 md:h-full md:bg-gradient-to-r rtl:md:bg-gradient-to-l"
                    aria-hidden="true"
                />
            </div>

            <div className="relative z-20 px-spacing-md pb-spacing-2xl pt-2 text-center md:absolute md:start-0 md:top-0 md:w-[45%] md:h-full md:flex md:flex-col md:justify-center md:ps-16 lg:ps-32 md:pe-12 md:pb-0 md:pt-0 md:text-start">
                <div className="flex flex-col items-center md:items-start">
                    <p className="text-[12px] md:text-[11px] tracking-wide text-foreground/60 mb-5">
                        {t('landing.hero.label', 'طراحی دکوراسیون خانه با هوش مصنوعی')}
                    </p>
                    <h1 id="homa-home-title" className="text-[42px] font-light leading-[1.12] tracking-tight text-foreground md:text-[60px] lg:text-[72px] xl:text-[84px] mb-5 w-full">
                        {t('landing.hero.title', 'هُما؛')}{' '}
                        <span className="opacity-60 font-light italic">
                            {t('landing.hero.titleAccent', 'نسخه‌یِ بهترِ')}
                        </span>{' '}
                        <span className="whitespace-nowrap">{t('landing.hero.titleEnd', 'خونه‌ت.')}</span>
                    </h1>
                    <p className="text-foreground/80 font-light leading-[1.9] max-w-[500px] text-[16px] md:text-[18px] mb-7">
                        {t('landing.hero.description', 'عکس فضای خونه‌ت رو به هما بده. ببین کدوم وسایل بهتره حفظ یا جابه‌جا بشن، چه چیزی نیاز به تغییر داره و اگر خرید لازمه، چه انتخابی با خونه‌ت هماهنگ‌تره.')}
                    </p>
                    <div className="flex flex-col items-center md:items-start gap-4 w-full">
                        <Link to="/studio/upload" onClick={onGetStarted} className="bg-black text-white w-full max-w-[315px] md:w-auto md:min-w-[265px] h-[58px] px-7 flex items-center justify-center gap-4 text-[15px] hover:bg-black/90 transition-colors rounded-[2px]">
                            <span>{t('landing.hero.cta', 'شروع طراحی با عکس خونه')}</span>
                            <ArrowLeft className="ltr:rotate-180" size={16} aria-hidden="true" />
                        </Link>
                        <a href="/blog/" className="inline-flex items-center min-h-[32px] text-[12px] text-foreground/65 underline underline-offset-4 hover:text-foreground transition-colors">
                            {t('landing.hero.secondary', 'راهنماهای انتخاب و تغییر دکوراسیون')}
                        </a>
                    </div>
                </div>
            </div>

            <div className="hidden md:flex absolute bottom-12 left-12 z-20 items-center gap-6 opacity-40 pointer-events-none" aria-hidden="true">
                <span className="text-[10px] tracking-[0.8em] uppercase font-light transform -rotate-90 origin-left">EST. 2026</span>
                <div className="w-[1px] h-24 bg-foreground" />
            </div>
        </section>
    );
}
