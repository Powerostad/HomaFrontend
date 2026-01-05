"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, ArrowLeft, ArrowRight, Share2, Info, ChevronLeft, ChevronRight, Zap, ScanLine, Maximize2, ShoppingBag } from "lucide-react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { BeforeAfterSlider } from "../../../components/BeforeAfterSlider";
import { useNavigate } from "react-router-dom";

export interface OutputShowcaseProps {
    onGetStarted?: () => void;
}

const PRODUCTS = [
    {
        id: "1",
        name: "فرش دستباف افشان",
        category: "فرش",
        price: "۴۵,۰۰۰,۰۰۰",
        image: "https://images.unsplash.com/photo-1594125675036-153d1b064762?q=80&w=300"
    },
    {
        id: "2",
        name: "مبل راحتی مینیمال",
        category: "مبل",
        price: "۲۸,۰۰۰,۰۰۰",
        image: "https://images.unsplash.com/photo-1759722665629-29df6ee4f9a5?q=80&w=300"
    },
    {
        id: "3",
        name: "آباژور مدرن برنزی",
        category: "نورپردازی",
        price: "۴,۵۰۰,۰۰۰",
        image: "https://images.unsplash.com/photo-1756474215831-4e5f8309c6bc?q=80&w=300"
    }
];

export function OutputShowcase({
    onGetStarted
}: OutputShowcaseProps) {
    const navigate = useNavigate();

    const handleStudioStart = () => {
        navigate("/studio/upload");
    };

    return (
        <section className="relative w-full py-24 md:py-32 bg-surface-default overflow-hidden">
            {/* DESKTOP VIEW */}
            <div className="hidden md:block container mx-auto px-6 relative z-10">
                {/* Title and Introduction */}
                <div className="max-w-4xl mx-auto text-center mb-12 md:mb-20 px-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
                    >
                        <p className="text-[10px] font-light tracking-[0.4em] opacity-60 uppercase mb-8">Interior visualization</p>
                        <h2 className="font-light leading-[1.2] mb-10 text-[28px] md:text-[42px] text-foreground">
                            <br />
                            <span className="italic opacity-60 font-light text-[24px] md:text-[38px]">عکس خونه‌ت</span> رو به ما نشون بده، ما مبلمانی رو میاریم که باهاش ست میشه.
                        </h2>
                        <div className="w-16 h-[0.5px] bg-black/10 mx-auto" />
                    </motion.div>
                </div>

                {/* The Render & Product List (Editorial Structure) */}
                <div className="relative max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16">

                        {/* Main Render Image */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5 }}
                            className="w-full lg:w-[65%] aspect-[1.4/1] overflow-hidden bg-surface-default border relative"
                            style={{ borderColor: 'var(--color-border-default)' }}
                        >
                            <BeforeAfterSlider
                                beforeImage="https://images.unsplash.com/photo-1722858812150-2ff7011007cd?q=80&w=1600"
                                afterImage="https://images.unsplash.com/photo-1644057501622-dfa7dd26dbfb?q=80&w=1600"
                                className="w-full h-full object-cover"
                            />

                            {/* Labels - Desktop */}
                            <div className="absolute top-10 right-10 z-20 pointer-events-none">
                                <span className="text-white/40 text-[10px] uppercase tracking-[0.4em] font-light">
                                    Original Space
                                </span>
                            </div>
                            <div className="absolute top-10 left-10 z-20 pointer-events-none">
                                <span className="text-white text-[10px] uppercase tracking-[0.4em] font-medium">
                                    Enhanced Room
                                </span>
                            </div>
                        </motion.div>

                        {/* Product List (Minimalist Editorial Card) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                            className="w-full lg:w-[35%] bg-surface-page p-10 lg:p-14 border flex flex-col justify-between"
                            style={{ borderColor: 'var(--color-border-default)' }}
                        >
                            <div>
                                <div className="mb-14 text-right">
                                    <h3 className="text-[16px] font-medium tracking-[0.3em] uppercase mb-2 opacity-80">محصولات پیشنهادی هما</h3>
                                    <span className="text-[12px] font-light opacity-50 tracking-widest">۳ موردِ انتخاب شده</span>
                                </div>

                                <div className="space-y-12">
                                    {PRODUCTS.map((product) => (
                                        <div key={product.id} className="group flex items-center justify-between gap-8">
                                            {/* Image on the Right */}
                                            <div className="w-28 h-28 bg-surface-default flex items-center justify-center overflow-hidden border transition-all duration-700 rounded-[1px] shrink-0" style={{ borderColor: 'var(--color-border-default)' }}>
                                                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                                            </div>

                                            {/* Description on the Left */}
                                            <div className="flex-1 text-right">
                                                <h4 className="text-[18px] font-light mb-1 text-foreground/80 group-hover:text-foreground transition-colors">{product.name}</h4>
                                                <p className="text-[12px] font-light opacity-60 tracking-widest mb-3 uppercase">{product.category}</p>
                                                <div className="flex items-baseline justify-end gap-1.5">
                                                    <span className="text-[18px] font-medium tracking-tighter">{product.price}</span>
                                                    <span className="text-[11px] font-light opacity-50">تومان</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-16 text-right">
                                <button className="flex items-center gap-6 group mr-auto">
                                    <span className="text-[12px] font-medium tracking-[0.4em] uppercase border-b border-black/10 pb-1.5 group-hover:border-black transition-all duration-500">خرید کل چیدمان</span>
                                    <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                                        <ShoppingBag size={14} />
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Desktop CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="mt-12 flex flex-col items-center gap-6"
                    >
                        <div className="w-[0.5px] h-12 bg-black/10 mb-2" />
                        <button
                            onClick={handleStudioStart}
                            className="bg-black text-white px-10 h-[64px] flex items-center justify-center gap-6 text-[13px] tracking-[0.3em] uppercase hover:bg-black/90 transition-all duration-500 rounded-[2px]"
                        >
                            <span>خونه‌تو همین الان تغییر بده</span>
                            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                                <ArrowLeft size={16} />
                            </div>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden flex flex-col px-6 space-y-10 pb-10">
                {/* Title */}
                <div className="pt-4 text-center space-y-6">
                    <p className="text-[10px] font-light tracking-[0.4em] opacity-60 uppercase">Interior visualization</p>
                    <h2 className="font-light leading-[1.3] px-2 text-[26px] text-foreground">
                        <span className="italic opacity-60 font-light">عکس خونه‌ت</span> رو به ما نشون بده، ما مبلمانی رو میاریم که باهاش ست میشه.
                    </h2>
                    <div className="w-10 h-[0.5px] bg-black/10 mx-auto" />
                </div>

                {/* Hero Result */}
                <div className="relative w-full aspect-[4/5] bg-surface-page overflow-hidden border rounded-[1px]" style={{ borderColor: 'var(--color-border-default)' }}>
                    <BeforeAfterSlider
                        beforeImage="https://images.unsplash.com/photo-1722858812150-2ff7011007cd?q=80&w=1600"
                        afterImage="https://images.unsplash.com/photo-1644057501622-dfa7dd26dbfb?q=80&w=1600"
                        className="w-full h-full object-cover grayscale-[0.1]"
                    />

                    {/* Labels - Subtle Editorial */}
                    <div className="absolute top-8 right-8 z-20 pointer-events-none">
                        <span className="text-white/40 text-[9px] uppercase tracking-[0.4em] font-light">
                            Original Space
                        </span>
                    </div>
                    <div className="absolute top-8 left-8 z-20 pointer-events-none">
                        <span className="text-white text-[9px] uppercase tracking-[0.4em] font-medium">
                            Enhanced Room
                        </span>
                    </div>
                </div>

                {/* Product List */}
                <div className="space-y-12 bg-surface-page p-8 border rounded-[1px]" style={{ borderColor: 'var(--color-border-default)' }}>
                    <div className="flex items-center justify-between border-b pb-6" style={{ borderColor: 'var(--color-border-default)' }}>
                        <h3 className="text-[14px] font-medium uppercase tracking-[0.2em] opacity-80">محصولات پیشنهادی هما</h3>
                        <span className="text-[10px] font-light opacity-50">۳ مورد</span>
                    </div>

                    <div className="space-y-10">
                        {PRODUCTS.map((product) => (
                            <div key={product.id} className="flex items-center gap-8">
                                <div className="w-20 h-20 bg-surface-page overflow-hidden border flex items-center justify-center shrink-0 rounded-[1px]" style={{ borderColor: 'var(--color-border-default)' }}>
                                    <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover grayscale-[0.2]" />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <h4 className="text-[15px] font-light truncate text-foreground/80">{product.name}</h4>
                                    <p className="text-[10px] font-light opacity-60 tracking-widest uppercase mb-2">{product.category}</p>
                                    <div className="flex items-baseline justify-end gap-1.5">
                                        <span className="text-[15px] font-medium tracking-tighter">{product.price}</span>
                                        <span className="text-[10px] font-light opacity-50">تومان</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="pt-8 text-center space-y-6">
                    <button
                        onClick={handleStudioStart}
                        className="bg-black text-white w-full max-w-[260px] mx-auto h-[64px] text-[13px] font-medium tracking-[0.3em] uppercase rounded-[2px] flex items-center justify-center gap-6"
                    >
                        <span>خونه‌تو همین الان تغییر بده</span>
                        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                            <ArrowLeft size={16} />
                        </div>
                    </button>
                    <p className="text-[9px] opacity-20 tracking-[0.5em] uppercase">Interior visualization</p>
                </div>
            </div>
        </section>
    );
}