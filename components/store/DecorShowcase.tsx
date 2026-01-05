import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Sparkles, X, RefreshCw } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { DecorExample } from '../../data/mock';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '../ui/drawer';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface DecorShowcaseProps {
  examples: DecorExample[];
}

export function DecorShowcase({ examples }: DecorShowcaseProps) {
  const [selectedDecor, setSelectedDecor] = useState<DecorExample | null>(null);

  if (!examples || examples.length === 0) return null;

  return (
    <section className="mb-12" dir="rtl">
      {/* Header - Desktop version */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-black mb-1">نمونه‌کارهای این فروشگاه</h2>
          <p className="text-[13px] text-black/40 font-medium">دکورهای واقعی با محصولات همین ویترین</p>
        </div>
        <button className="text-[12px] font-bold text-black/60 hover:text-black transition-colors">
          مشاهده همه
        </button>
      </div>

      {/* Header - Mobile version (Compact) */}
      <div className="md:hidden flex items-center justify-between mb-4 px-6 md:px-0">
        <div>
          <h2 className="text-[15px] font-bold text-black mb-0.5">در خانه مشتری‌ها</h2>
          <p className="text-[10px] text-black/40 font-bold">چند نمونه واقعی</p>
        </div>
        <button className="text-[10px] font-bold text-black/60">
          مشاهده همه
        </button>
      </div>

      {/* Carousel */}
      <div className="relative group">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth">
          {examples.map((example) => (
            <DecorCard 
              key={example.id} 
              example={example} 
              onClick={() => setSelectedDecor(example)}
            />
          ))}
        </div>

        {/* Desktop Navigation Arrows - Subtle */}
        <button className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white shadow-lg border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <ArrowRight size={16} className="text-black/60" />
        </button>
        <button className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white shadow-lg border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <ArrowLeft size={16} className="text-black/60" />
        </button>
      </div>

      {/* Decor Detail Drawer */}
      <Drawer open={!!selectedDecor} onOpenChange={(open) => !open && setSelectedDecor(null)}>
        <DrawerContent className="h-[85vh]">
          {selectedDecor && (
            <div className="mx-auto w-full max-w-2xl h-full flex flex-col">
              <DrawerHeader className="relative border-b border-black/5 flex-shrink-0">
                <DrawerTitle className="text-center font-bold font-vazirmatn text-[18px]">
                  {selectedDecor.title}
                </DrawerTitle>
                <DrawerClose asChild>
                  <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={20} className="text-black/40" />
                  </button>
                </DrawerClose>
              </DrawerHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {/* Hero Image */}
                <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-2xl">
                  <ImageWithFallback 
                    src={selectedDecor.image} 
                    alt={selectedDecor.title || 'دکور'} 
                    className="w-full h-full object-cover"
                  />
                  {selectedDecor.hasBeforeAfter && (
                    <div className="absolute top-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-full">
                      <span className="text-[12px] font-bold text-white uppercase tracking-widest">قبل / بعد</span>
                    </div>
                  )}
                </div>

                {/* Info & CTA */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[20px] font-bold text-black mb-1">محصولات استفاده شده</h3>
                      <p className="text-[13px] text-black/40">تمام محصولات این دکور در همین فروشگاه موجود است.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-black/5 rounded-full">
                      <Sparkles size={14} className="text-black/60" />
                      <span className="text-[11px] font-bold text-black/60">نتیجه واقعی</span>
                    </div>
                  </div>

                  {/* Mock Product List in Decor */}
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 border border-black/5">
                        <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-shrink-0">
                          <ImageWithFallback src={`https://images.unsplash.com/photo-15${i}8500339042-8059dc18b911?auto=format&fit=crop&q=80&w=200`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-black leading-tight">محصول شماره {i}</span>
                          <span className="text-[10px] text-black/40">۱۲,۵۰۰,۰۰۰ تومان</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full h-14 rounded-full bg-black text-white font-bold text-[15px] shadow-lg shadow-black/10 flex items-center justify-center gap-2 group">
                    <Sparkles size={18} />
                    <span>امتحان این دکور در فضای خودم</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function DecorCard({ example, onClick }: { example: DecorExample; onClick: () => void }) {
  const [showBefore, setShowBefore] = useState(false);
  
  const toPersianDigits = (num: number | string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
  };

  const toggleBefore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBefore(!showBefore);
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01, y: -2 }}
      className="flex-shrink-0 w-[72vw] md:w-[320px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-[16/9] md:aspect-[4/3] max-h-[180px] md:max-h-none rounded-[20px] md:rounded-[24px] overflow-hidden mb-2 md:mb-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500">
        <AnimatePresence mode="wait">
          <motion.div
            key={showBefore ? 'before' : 'after'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <ImageWithFallback 
              src={showBefore && example.beforeImage ? example.beforeImage : example.image} 
              alt={example.title || 'دکور'} 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Comparison Toggle / Label */}
        {example.hasBeforeAfter ? (
          <button 
            onClick={toggleBefore}
            className="absolute top-3 right-3 md:top-4 md:right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 hover:bg-black/60 transition-colors z-20"
          >
            <RefreshCw size={12} className={`text-white transition-transform duration-500 ${showBefore ? 'rotate-180' : ''}`} />
            <span className="text-[10px] md:text-[11px] font-bold text-white">
              {showBefore ? 'بعد از تغییر' : 'قبل از تغییر'}
            </span>
          </button>
        ) : (
          <div className="absolute top-3 right-3 md:top-4 md:right-4 px-2 py-0.5 md:px-3 md:py-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-full z-20">
            <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider">
              فضای واقعی
            </span>
          </div>
        )}

        {/* Overlay subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60 pointer-events-none" />
      </div>

      {/* Info - Hidden on mobile, only desktop */}
      <div className="hidden md:flex items-center justify-between px-1">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-black/40 mb-0.5">
            {toPersianDigits(example.productCount)} محصول از این فروشگاه
          </span>
          <h3 className="text-[14px] font-bold text-black">{example.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-[12px] font-bold text-black/60 group-hover:text-black transition-colors">
          <span>مشاهده دکور</span>
          <ArrowLeft size={14} />
        </div>
      </div>
    </motion.div>
  );
}