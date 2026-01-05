import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/Header';

const PHASES = [
  {
    h1: "داریم فضای خونه‌ت رو می‌فهمیم…",
    body: "نور، مقیاس و حال‌وهوای فضا",
    micro: "درک فضا"
  },
  {
    h1: "داریم بررسی می‌کنیم این فضا می‌تونه چی بشه…",
    body: "با انتخاب‌هایی که به سبکِ فضا می‌خوره",
    micro: "هماهنگی سبک"
  },
  {
    h1: "داریم بهترین چیدمان رو برات می‌سازیم…",
    body: "تا انتخاب و خرید، ساده‌تر بشه",
    micro: "ساخت نتیجه"
  }
];

export function StudioProgressPage() {
  const navigate = useNavigate();
  const { selectedFile } = useApp() as any;
  const [phase, setPhase] = useState(0);
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    // Load background image
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => setBgImage(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    }

    // Phase timer
    const phaseInterval = setInterval(() => {
      setPhase((p) => {
        if (p < 2) return p + 1;
        return p;
      });
    }, 10000); // 10 seconds per phase

    // Completion timer (30s total)
    const completionTimer = setTimeout(() => {
      navigate('/studio/result/mock-job-id');
    }, 30000);

    return () => {
      clearInterval(phaseInterval);
      clearTimeout(completionTimer);
    };
  }, [selectedFile, navigate]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background flex flex-col items-center justify-center font-vazirmatn text-foreground" dir="rtl">
      
      {/* --- Background --- */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <>
            <img 
              src={bgImage} 
              alt="Background" 
              className="w-full h-full object-cover blur-[80px] scale-110 opacity-60"
            />
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 mix-blend-overlay" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-50 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[20px]" />
      </div>

      <Header theme="light" disableNavigation={true} />

      {/* --- Center Stack --- */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6 text-center">
        
        {/* Progress Ring */}
        <div className="relative w-[120px] h-[120px] mb-6 flex items-center justify-center">
          {/* Base Circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="56"
              fill="none"
              stroke="currentColor"
              className="text-black/5 dark:text-white/5"
              strokeWidth="2"
            />
            {/* Animated Ring - Changes per phase */}
            <motion.circle
              key={`ring-${phase}`}
              cx="60"
              cy="60"
              r="56"
              fill="none"
              stroke="currentColor"
              className="text-black dark:text-white"
              strokeWidth={phase === 0 ? 2 : phase === 1 ? 3 : 4}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 0.3, 0.7, 1],
                opacity: 1,
                rotate: phase === 0 ? 0 : phase === 1 ? 180 : 360
              }}
              transition={{ 
                duration: 10, 
                ease: "linear",
                repeat: Infinity 
              }}
            />
          </svg>
          
          {/* Logo in Center */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
             <div className="w-3 h-3 bg-black dark:bg-white rounded-full" />
          </motion.div>
        </div>

        {/* Narrative Text */}
        <div className="h-[140px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight text-black dark:text-white mb-2">
                {PHASES[phase].h1}
              </h1>
              <p className="text-[14px] sm:text-[16px] font-medium text-black/60 dark:text-white/60">
                {PHASES[phase].body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Micro Status */}
        <div className="mt-4 mb-3">
          <AnimatePresence mode="wait">
             <motion.span
              key={`micro-${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="text-[12px] font-medium text-black dark:text-white uppercase tracking-widest"
             >
               {PHASES[phase].micro}
             </motion.span>
          </AnimatePresence>
        </div>

        {/* ETA */}
        <div className="text-[12px] font-medium text-black/50 dark:text-white/50">
          معمولاً کمتر از ۳۰ ثانیه
        </div>

      </div>

    </div>
  );
}
