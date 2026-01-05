import { useState } from "react";
import { motion } from "motion/react";

const Chip = () => (
  <div className="w-9 h-7 bg-yellow-600/20 rounded md:rounded-md border border-yellow-500/40 flex items-center justify-center relative overflow-hidden backdrop-blur-sm shadow-sm scale-95 opacity-90">
    <div className="absolute inset-0 grid grid-cols-2 gap-px bg-yellow-500/10">
      <div className="border-r border-yellow-500/30"></div>
      <div></div>
    </div>
    <div className="absolute top-1/2 w-full h-px bg-yellow-500/30"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent opacity-50"></div>
  </div>
);

export function PricingSection() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');

  const cards = [
    {
      id: 'FREE',
      name: 'BASIC',
      tier: 'Starter Tier',
      price: '0',
      sub: 'رایگان',
      features: ['۵ پروژه', 'فضای محدود', 'پشتیبانی ایمیلی'],
      code: '0000 0000 0000',
      stickerColor: 'bg-[#E5E5E5]',
      stickerText: 'text-black',
      ctaVariant: 'outline',
      bestValue: false
    },
    {
      id: 'PRO',
      name: 'GOLD',
      tier: 'Pro Tier',
      price: cycle === 'monthly' ? '990' : '9,900',
      sub: 'حرفه‌ای',
      features: ['پروژه نامحدود', 'دسترسی API', 'پشتیبانی ۲۴/۷', 'حذف تبلیغات'],
      code: '5495 7381 3759',
      stickerColor: 'bg-[#DFFF00]',
      stickerText: 'text-black',
      ctaVariant: 'solid',
      bestValue: true,
      stickerStyle: { boxShadow: 'inset 0px 0px 30px rgba(0,0,0,0.09)' }
    },
    {
      id: 'ENT',
      name: 'BLACK',
      tier: 'Enterprise Tier',
      price: 'توافقی',
      sub: 'سازمانی',
      features: ['سرور اختصاصی', 'مدیر اکانت', 'قرارداد SLA', 'بک‌آپ ساعتی'],
      code: '9988 7766 5544',
      stickerColor: 'bg-[#03302A]',
      stickerText: 'text-white',
      ctaVariant: 'glass',
      bestValue: false,
      stickerStyle: { 
        background: 'linear-gradient(135deg, #0f5851 0%, #04302c 60%, #011816 100%)', 
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)' 
      }
    }
  ];

  return (
    <div className="bg-surface-default flex flex-col items-center justify-center py-24 px-4 relative overflow-hidden w-full" dir="rtl">
      
      {/* Header */}
      <div className="relative z-10 text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter text-black font-vazirmatn">
            MEMBERSHIP <span className="text-neutral-500 font-mono font-light">2025</span>
        </h1>
        
        {/* Toggle Switch */}
        <div className="inline-flex bg-black/5 p-1 rounded-2xl border border-black/10 backdrop-blur-md">
            <button 
                onClick={() => setCycle('monthly')}
                className={`px-6 py-2 text-sm font-medium rounded-xl transition-all duration-300 font-vazirmatn ${cycle === 'monthly' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black'}`}
            >
                ماهانه
            </button>
            <button 
                onClick={() => setCycle('yearly')}
                className={`px-6 py-2 text-sm font-medium rounded-xl transition-all duration-300 font-vazirmatn ${cycle === 'yearly' ? 'bg-white text-black shadow-md' : 'text-neutral-500 hover:text-black'}`}
            >
                سالانه
            </button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl w-full z-10 items-end">
        {cards.map((card, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                className="relative group"
            >
                {/* Main Card Structure */}
                <div className={`
                    relative w-full h-[600px] rounded-[32px] p-3
                    bg-[#080808] border border-white/[0.08]
                    shadow-2xl overflow-hidden transition-all duration-500
                    ${card.bestValue ? 'ring-1 ring-[#DFFF00]/20 hover:scale-[1.02] z-10' : 'hover:border-white/20'}
                `}>
                    {/* 1. THE "STICKER" (Top Section) */}
                    <div 
                        className={`
                            relative w-full h-[260px] rounded-[24px] p-6 flex flex-col justify-between
                            ${card.stickerColor} ${card.stickerText}
                            shadow-lg transition-transform duration-500 group-hover:translate-y-1
                        `}
                        style={card.stickerStyle}
                    >
                         {/* Sticker Header */}
                         <div className="relative z-10 flex justify-between items-start">
                            <div className="flex flex-col items-start">
                                <h3 className="text-[22px] font-black tracking-tighter uppercase font-sans leading-none mb-1">{card.name}</h3>
                                <span className="font-mono text-[13px] uppercase tracking-wider opacity-80">{card.tier}</span>
                            </div>
                            <div className="w-7 h-7 rounded-full border border-current opacity-20 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                            </div>
                         </div>

                         {/* Price */}
                         <div className="relative z-10">
                            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2 font-mono">Total Balance</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[42px] font-black tracking-tighter font-mono">{card.price}</span>
                                {card.price !== "توافقی" && <span className="text-sm font-bold opacity-60">تومان</span>}
                            </div>
                         </div>
                    </div>

                    {/* 2. THE "BODY" (Bottom Section) */}
                    <div className="relative flex flex-col justify-between h-[310px] px-3 py-6">
                        
                        {/* Row A: Tech Elements */}
                        <div className="flex justify-between items-center px-2 opacity-80 scale-[0.94]">
                             <Chip />
                             <svg className="w-7 h-7 text-white/40 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                             </svg>
                        </div>

                        {/* Row B: Card Number */}
                        <div className="px-2">
                             <div className="font-mono text-[15px] font-semibold text-white/60 tracking-[0.15em] group-hover:text-white/90 transition-colors duration-300 text-left dir-ltr">
                                {card.code}
                             </div>
                             <div className="flex gap-4 mt-2 text-[9px] text-white/30 font-mono uppercase tracking-widest">
                                <span>EXP 05/28</span>
                                <span>CVV 092</span>
                             </div>
                        </div>

                        {/* Row C: Features */}
                        <div className="space-y-2 px-2">
                            {card.features.map((feat, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-[13.5px] font-normal leading-[1.5] text-white/[0.84] font-vazirmatn">
                                    <div className={`w-1 h-1 rounded-full ${card.id === 'PRO' ? 'bg-[#DFFF00]' : 'bg-white/50'}`}></div>
                                    <span>{feat}</span>
                                </div>
                            ))}
                        </div>

                        {/* Row D: CTA */}
                        <button 
                            className={`
                                w-full h-[52px] rounded-[22px] text-[15px] font-semibold tracking-tight transition-all
                                flex items-center justify-center mt-2 font-vazirmatn
                                ${card.ctaVariant === 'solid' 
                                    ? 'bg-[#DFFF00] text-black hover:scale-[1.02] shadow-lg' 
                                    : card.ctaVariant === 'glass'
                                        ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                        : 'border border-white/10 text-white/60 hover:text-white hover:border-white/30'
                                }
                            `}
                        >
                            انتخاب {card.sub}
                        </button>
                    </div>
                </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
}
