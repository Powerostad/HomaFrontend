import { BeforeAfterSlider } from "../../../components/BeforeAfterSlider";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
const imgEmpty = "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200";
const imgWithRug = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

export interface HeroSectionProps {
    onGetStarted: () => void;
}

export function HeroSection({
    onGetStarted: _onGetStarted
}: HeroSectionProps) {
    const navigate = useNavigate();

    const handleStudioStart = () => {
        navigate("/studio/upload");
    };

    return (
        <section className="relative w-full bg-surface-default overflow-hidden">
            {/* MOBILE HERO (Editorial Layout - Zara Home Aesthetic) */}
            <div className="md:hidden flex flex-col bg-surface-default">
                {/* Hero Image / Slider Section */}
                <div className="relative w-full aspect-[4/5] overflow-hidden">
                    <BeforeAfterSlider
                        beforeImage={imgEmpty}
                        afterImage={imgWithRug}
                        className="w-full h-full object-cover"
                    />
                    {/* Subtle Editorial Fade to Page Background */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-surface-default via-surface-default/60 to-transparent z-10" />
                </div>

                {/* Content Section */}
                <div className="relative z-20 px-spacing-md pb-spacing-2xl text-center">
                    <div className="flex flex-col gap-2 mb-6 items-center mt-2"> {/* Reduced gap from 6 to 2 and mb from 12 to 6 */}
                        <h1 className="text-[42px] font-light leading-[1.1] tracking-tight text-foreground">
                            هُما؛ <span className="opacity-60 font-light italic text-[38px]">نسخه‌یِ بهترِ</span> <br />
                            خونه‌ت.
                        </h1>
                        <p className="text-foreground/80 font-light leading-relaxed max-w-[280px] text-p text-[20px]">
                            هُما کمکت می‌کنه <br />
                            دکور مناسب خونه‌ت رو پیدا کنی.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 items-center">
                        <button
                            onClick={handleStudioStart}
                            className="bg-black text-white w-full max-w-[280px] h-[64px] flex items-center justify-center gap-4 text-[16px] font-light hover:bg-black/90 transition-all duration-500 rounded-[2px] mt-2"
                        >
                            <span>نسخهٔ جدیدِ خونه‌تو ببین</span>
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                                <ArrowLeft size={16} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP HERO --- */}
            <section className="hidden md:flex w-full h-screen bg-surface-default overflow-hidden relative">
                {/* Visual Area (Left) */}
                <div className="absolute top-0 left-0 w-[65%] h-full z-0 overflow-hidden">
                    <BeforeAfterSlider
                        beforeImage={imgEmpty}
                        afterImage={imgWithRug}
                        className="w-full h-full object-cover grayscale-[0.02]"
                    />
                    {/* Seamless Editorial Blend to Copy Area */}
                    <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-surface-default via-surface-default/80 to-transparent z-10" />
                </div>

                {/* Content Area (Right) */}
                <div className="absolute top-0 right-0 z-20 w-[45%] h-full flex flex-col justify-center pr-12 md:pr-16 lg:pr-32 pl-12" dir="rtl">
                    <motion.div
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1.8, ease: [0.19, 1, 0.22, 1] }}
                        className="flex flex-col items-start w-full"
                    >
                        {/* Label/Tag */}
                        <div className="flex items-center gap-6 opacity-60 mb-6">
                            <div className="w-16 h-[0.5px] bg-foreground" />
                            <span className="text-[10px] tracking-[0.6em] uppercase font-light text-start">Homa Editorial</span>
                        </div>

                        {/* Heading */}
                        <h1 className="font-light leading-[1.05] tracking-tighter md:text-[60px] lg:text-[72px] xl:text-[84px] text-foreground mb-3 text-start w-full">
                            هُما؛ <span className="italic opacity-60 font-light">نسخه‌یِ بهترِ</span> <br />
                            خونه‌ت.
                        </h1>

                        {/* Paragraph */}
                        <p className="font-light leading-relaxed max-w-[480px] opacity-70 text-foreground mb-6 text-start text-[20px]">
                            هُما کمکت می‌کنه <br />
                            دکور مناسب خونه‌ت رو پیدا کنی.
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={handleStudioStart}
                            className="group bg-black text-white px-8 h-[52px] flex items-center gap-4 hover:bg-black/90 transition-all duration-500 rounded-[2px]"
                        >
                            <span className="text-[13px] font-medium tracking-[0.2em] uppercase whitespace-nowrap">نسخهٔ جدیدِ خونه‌تو ببین</span>
                            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-700">
                                <ArrowLeft size={14} />
                            </div>
                        </button>
                    </motion.div>
                </div>

                {/* Framing Details */}
                <div className="absolute bottom-12 left-12 z-20 flex items-center gap-6 opacity-40 pointer-events-none">
                    <span className="text-[10px] tracking-[0.8em] uppercase font-light transform -rotate-90 origin-left">EST. 2026</span>
                    <div className="w-[1px] h-24 bg-foreground" />
                </div>
            </section>
        </section>
    );
}