import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
const imgEmpty = "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200";
const imgWithCurtains = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";
import { Tag, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";

export function ShoppingPropSection() {
  const navigate = useNavigate();
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => handleMove(e);
    const onEnd = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <section className="bg-white py-12 md:py-24 overflow-hidden" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">

          {/* Text Side */}
          <div className="flex-1 space-y-10 text-center md:text-right order-2 md:order-1">
            <div className="space-y-8">
              <p className="text-[10px] font-light tracking-[0.4em] opacity-60 uppercase">B2B Solutions</p>
              <h2 className="font-light leading-[1.15] tracking-tight text-[32px] md:text-[52px] text-foreground">
                همکاری با هما؛ <br />
                <span className="italic font-light opacity-60 text-[28px] md:text-[46px]">فروشِ بیشتر با نمایشِ بهتر.</span>
              </h2>
              <p className="text-foreground/70 font-light leading-relaxed max-w-xl opacity-80 text-p mx-auto md:mr-0">
                محصولات خود را در خانه‌ی هزاران مشتری نمایش دهید. هما به‌سادگی با زیرساخت فروشگاه شما یکپارچه شده و تجربه‌ای متمایز از خرید را رقم می‌زند.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={() => navigate("/collaboration")}
                className="group bg-black text-white px-10 h-[64px] flex items-center justify-between gap-10 hover:bg-black/90 transition-all duration-500 rounded-[2px] mx-auto md:mr-0"
              >
                <span className="text-[12px] font-medium tracking-[0.3em] uppercase">درخواستِ پنلِ همکاری</span>
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-700">
                  <ArrowLeft size={16} />
                </div>
              </button>
            </div>
          </div>

          {/* Visual Side */}
          <div className="flex-1 relative order-1 md:order-2">
            <div
              ref={containerRef}
              className="relative aspect-[4/5] overflow-hidden group cursor-col-resize select-none border border-black/[0.03] rounded-[2px] bg-[#F7F7F5]"
              onMouseDown={() => { isDragging.current = true; }}
              onTouchStart={() => { isDragging.current = true; }}
            >
              {/* After Image (With Curtains) */}
              <div className="absolute inset-0 w-full h-full">
                <ImageWithFallback
                  src={imgWithCurtains}
                  alt="Furnished Room"
                  className="w-full h-full object-cover grayscale-[0.05]"
                />
              </div>

              {/* Before Image (Empty) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden z-10"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <ImageWithFallback
                  src={imgEmpty}
                  alt="Empty Room"
                  className="w-full h-full object-cover grayscale-[0.05]"
                />
              </div>

              {/* Slider Handle */}
              <div
                className="absolute inset-y-0 w-[0.5px] bg-white/40 backdrop-blur-sm z-30"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <div className="flex items-center gap-0">
                    <ChevronLeft size={16} strokeWidth={2.5} className="text-black -mr-1" />
                    <ChevronRight size={16} strokeWidth={2.5} className="text-black -ml-1" />
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-8 right-8 z-20 pointer-events-none">
                <span className="text-white text-[9px] uppercase tracking-[0.6em] font-medium opacity-80">Final Setting</span>
              </div>
              <div className="absolute top-8 left-8 z-20 pointer-events-none">
                <span className="text-white/40 text-[9px] uppercase tracking-[0.6em] font-light">Raw Space</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function TagItem({ x, y, label, price }: { x: string; y: string; label: string; price: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.5 }}
      className="absolute group/tag cursor-pointer"
      style={{ left: x, top: y }}
    >
      <div className="relative">
        <div className="w-2 h-2 bg-white rounded-full shadow-xl relative z-10" />
        <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-40" />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-xl px-4 py-2 border border-white/20 opacity-0 translate-x-4 transition-all duration-700 group-hover/tag:opacity-100 group-hover/tag:translate-x-0 w-40">
          <p className="text-[11px] font-medium text-[#292b2d] mb-1" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>{label}</p>
          <p className="text-[10px] font-light text-[#292b2d]/60" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>{price} تومان</p>
        </div>
      </div>
    </motion.div>
  );
}