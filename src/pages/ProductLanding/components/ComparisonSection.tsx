"use client";

import {useEffect, useRef, useState} from "react";
import {motion} from "motion/react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {ImageWithFallback} from "../../../components/figma/ImageWithFallback";
import {ChevronLeft, ChevronRight} from "lucide-react";

const rugBefore = "/images/comparison/rug/before.jpg";
const rugAfter = "/images/comparison/rug/after.jpg";
const beddingBefore = "/images/comparison/bedding/before.jpg";
const beddingAfter = "/images/comparison/bedding/after.jpg";
// const sofaBefore = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";
// const sofaAfter = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

type ComparisonItem = {
    id: string;
    label: string;
    beforeImg: string;
    afterImg: string;
    title: string;
    description: string;
};

export function ComparisonSection() {
    const {t} = useTranslation();
    const navigate = useNavigate();

    const COMPARISON_DATA: ComparisonItem[] = [
        {
            id: "rug",
            label: t('landing.comparison.rug', 'فرش'),
            beforeImg: rugBefore,
            afterImg: rugAfter,
            title: t('landing.comparison.rugTitle', 'جادوی تار و پود'),
            description: t('landing.comparison.rugDescription', 'تغییر کامل فضای نشیمن با انتخاب هوشمندانه فرش ایرانی.')
        },
        {
            id: "bedding",
            label: t('landing.comparison.bedding', 'روتختی'),
            beforeImg: beddingBefore,
            afterImg: beddingAfter,
            title: t('landing.comparison.beddingTitle', 'آرامش در جزئیات'),
            description: t('landing.comparison.beddingDescription', 'تبدیل اتاق خواب معمولی به یک فضای لوکس هتلی تنها با تغییر روتختی.')
        },
        // {
        //   id: "sofa",
        //   label: t('landing.comparison.sofa', 'مبل'),
        //   beforeImg: sofaBefore,
        //   afterImg: sofaAfter,
        //   title: t('landing.comparison.sofaTitle', 'ستون اصلی دکوراسیون'),
        //   description: t('landing.comparison.sofaDescription', 'مشاهده تاثیر مبل مدرن در بازسازی بصری فضای خانه.')
        // }
    ];

    const [activeTab, setActiveTab] = useState(COMPARISON_DATA[0]);
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        // Standard left-to-right calculation: (current X - left bound) / total width
        const position = ((x - rect.left) / rect.width) * 100;

        setSliderPosition(Math.max(0, Math.min(100, position)));
    };

    const handleStart = () => {
        isDragging.current = true;
    };
    const handleEnd = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleMove);
        window.addEventListener("touchend", handleEnd);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, []);

    return (
        <section className="relative w-full pt-12 pb-4 md:pt-20 md:pb-24 overflow-hidden bg-surface-default">
            <div className="container relative z-10 mx-auto px-6">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-10 md:mb-16">
                    <p className="text-[10px] font-light tracking-[0.4em] opacity-60 uppercase mb-6">{t('landing.comparison.label', 'Visual proof')}</p>
                    <h2 className="font-light mb-6 leading-[1.15] tracking-tight text-[28px] md:text-[52px] text-foreground">
                        {t('landing.comparison.title', 'خرید مبلمان،')} <span
                        className="italic font-light opacity-60">{t('landing.comparison.titleAccent', 'بدون حدس و تردید')}</span>
                    </h2>
                    <p className="text-foreground/70 font-light leading-relaxed max-w-xl mx-auto text-p">
                        {t('landing.comparison.description', 'هما کمک می‌کنه قبل از خرید، نتیجه‌ی انتخابت رو در فضای خودت ببینی.')}
                    </p>

                    <div
                        className="mt-10 p-1 bg-black/5 backdrop-blur-sm rounded-sm border border-black/5 flex w-fit mx-auto">
                        {COMPARISON_DATA.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item);
                                    setSliderPosition(50);
                                }}
                                className={`
                  px-10 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-all duration-700 rounded-sm relative
                  ${activeTab.id === item.id
                                    ? "text-white font-medium bg-black shadow-xl"
                                    : "text-black/40 font-light hover:text-black"}
                `}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-6xl mx-auto">
                    {/* Comparison Slider */}
                    <div
                        ref={containerRef}
                        className="relative aspect-[4/5] md:aspect-[1.4/1] w-full overflow-hidden cursor-col-resize select-none bg-surface-default border rounded-[2px]"
                        style={{borderColor: 'var(--color-border-default)'}}
                        onMouseDown={handleStart}
                        onTouchStart={handleStart}
                    >
                        {/* After Image */}
                        <div className="absolute inset-0 w-full h-full">
                            <ImageWithFallback
                                src={activeTab.afterImg}
                                alt="After"
                                className="w-full h-full object-cover grayscale-[0.1]"
                            />
                        </div>

                        {/* Before Image */}
                        <div
                            className="absolute inset-0 w-full h-full overflow-hidden z-10"
                            style={{clipPath: `inset(0 0 0 ${sliderPosition}%)`}}
                        >
                            <ImageWithFallback
                                src={activeTab.beforeImg}
                                alt="Before"
                                className="w-full h-full object-cover grayscale-[0.1]"
                            />
                        </div>

                        {/* Subtle Slider Handle */}
                        <div
                            className="absolute inset-y-0 w-[0.5px] bg-white/40 backdrop-blur-sm z-30"
                            style={{left: `${sliderPosition}%`, transform: 'translateX(-50%)'}}
                        >
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                }}
                            >
                                <div className="flex items-center gap-0">
                                    <ChevronLeft size={16} strokeWidth={2.5} className="text-black -mr-1"/>
                                    <ChevronRight size={16} strokeWidth={2.5} className="text-black -ml-1"/>
                                </div>
                            </div>
                        </div>

                        {/* Labels - Editorial subtle */}
                        <div className="absolute top-4 md:top-8 right-4 md:right-8 z-20">
                            <span
                                className="text-white/40 text-[9px] uppercase tracking-[0.2em] md:tracking-[0.6em] font-light">{t('landing.showcase.originalSpace', 'Original Space')}</span>
                        </div>
                        <div className="absolute top-4 md:top-8 left-4 md:left-8 z-20">
                            <span
                                className="text-white text-[9px] uppercase tracking-[0.2em] md:tracking-[0.6em] font-medium">{t('landing.showcase.enhancedRoom', 'Enhanced Room')}</span>
                        </div>
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 1, delay: 0.2}}
                        className="mt-12 md:mt-20 flex flex-col items-center"
                    >
                        <button
                            onClick={() => navigate('/explore')}
                            className="group bg-black text-white px-12 h-[72px] flex items-center gap-8 hover:bg-black/90 transition-all duration-500 rounded-[2px]"
                        >
                            <span
                                className="text-[14px] font-medium tracking-[0.3em] uppercase">{t('landing.comparison.viewCollections', 'مشاهده کالکشن‌ها')}</span>
                            <div
                                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-700">
                                <ChevronLeft size={16}/>
                            </div>
                        </button>
                        <p className="mt-8 text-[10px] opacity-20 tracking-[0.6em] uppercase hidden md:block">{t('landing.comparison.exploreCollections', 'Explore our curated collections')}</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}