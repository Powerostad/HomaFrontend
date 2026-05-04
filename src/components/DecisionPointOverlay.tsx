import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { createPortal } from 'react-dom';

interface DecisionPointProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  primaryCTA: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  };
  secondaryCTA?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  };
  exitAction?: {
    label: string;
    onClick: () => void;
  };
  image?: string;
  type?: 'neutral' | 'accent' | 'destructive';
  children?: React.ReactNode;
}

export function DecisionPointOverlay({
  isOpen,
  onClose,
  title,
  description,
  primaryCTA,
  secondaryCTA,
  exitAction,
  image,
  type = 'neutral',
  children,
}: DecisionPointProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />

          {/* Centered Modal Decision Point */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-40px)] max-w-[460px] md:max-w-[540px] max-h-[90vh] bg-[#FDFDFB] z-[9999] shadow-2xl flex flex-col overflow-hidden border border-black/5"
            dir="rtl"
          >
            {/* 1. Header Area - Compact */}
            <div className="flex-shrink-0 px-6 md:px-8 py-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/40" style={{ fontFamily: 'var(--font-family-sf-pro)' }}>
                  {type === 'accent' ? 'Selection' : 'Information'}
                </span>
                <button 
                  onClick={onClose}
                  className="p-2 text-black hover:text-red-600 transition-colors -mr-2"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* 2. Content Area - Compact for max image space */}
            <div className="flex-1 overflow-hidden px-6 md:px-8 pb-2 scrollbar-hide">
              <div className="h-full flex flex-col space-y-2">
                {/* Visual Section - Image-dominant: maximize height */}
                {image && (
                  <div className="overflow-hidden border border-black/[0.03]">
                    <ImageWithFallback
                      src={image}
                      alt={title}
                      className="w-full max-h-[62vh] object-contain"
                    />
                  </div>
                )}

                {/* Text Section - Compact and Focused */}
                <div className="flex-shrink-0 space-y-3">
                  <p className="text-label text-black/60 leading-relaxed font-light">
                    {description}
                  </p>
                  {children}
                </div>
              </div>
            </div>

            {/* 3. Sticky Action Footer - Compact */}
            <div className="flex-shrink-0 px-6 md:px-8 py-3 bg-[#FDFDFB] space-y-2">
              <div className="flex flex-col gap-2">
                {primaryCTA && (
                  <button
                    onClick={primaryCTA.onClick}
                    disabled={primaryCTA.disabled}
                    className={`w-full h-11 bg-black text-white text-[11px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center ${primaryCTA.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/90 active:scale-[0.98]'}`}
                  >
                    <span>{primaryCTA.label}</span>
                  </button>
                )}

                {secondaryCTA && (
                  <button
                    onClick={secondaryCTA.onClick}
                    disabled={secondaryCTA.disabled}
                    className={`w-full h-11 bg-white border border-black/10 text-black text-[11px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center ${secondaryCTA.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/[0.02] active:scale-[0.98]'}`}
                  >
                    <span>{secondaryCTA.label}</span>
                  </button>
                )}

                {exitAction && (
                  <button
                    onClick={exitAction.onClick}
                    className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-black/40 hover:text-black transition-colors flex items-center justify-center gap-2 group"
                  >
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                    <span>{exitAction.label}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center opacity-20 pointer-events-none">
                <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Homa Decision Point</span>
                <span className="text-[8px] font-bold uppercase tracking-[0.3em]">v4.0</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
