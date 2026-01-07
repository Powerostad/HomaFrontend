/**
 * SizeSelectionModal - مودال انتخاب سایز فرش
 *
 * Shows when a rug product has multiple available sizes.
 * User must select one size before proceeding to try-on.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ruler, Check, X } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface SizeOption {
  code: string;
  display: string;
}

interface SizeSelectionModalProps {
  isOpen: boolean;
  sizes: SizeOption[];
  productName?: string;
  onSelect: (sizeCode: string) => void;
  onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SizeSelectionModal({
  isOpen,
  sizes,
  productName,
  onSelect,
  onClose,
}: SizeSelectionModalProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Handle confirm button click
  const handleConfirm = () => {
    if (selectedCode) {
      onSelect(selectedCode);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    onClose();
  };

  // Reset selection when modal opens
  // useEffect is not needed since the component unmounts/remounts

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md overflow-hidden relative backdrop-blur-[40px] bg-white/30 border border-white/40 rounded-[var(--radius-card)]"
          style={{
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Decorative Shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
          >
            <X size={16} className="text-black/60" />
          </button>

          <div className="p-10 relative z-10">
            {/* Header */}
            <div className="text-center mb-8 space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-[1px] w-6 bg-black/20" />
                <Ruler size={16} className="text-black/40" />
                <div className="h-[1px] w-6 bg-black/20" />
              </div>

              <h2 className="text-[24px] font-bold text-black tracking-tight leading-tight">
                انتخاب سایز
              </h2>

              {productName && (
                <p className="text-[14px] text-black/50">
                  سایز مورد نظر برای <span className="font-bold text-black/70">{productName}</span> را انتخاب کنید
                </p>
              )}
            </div>

            {/* Size Options */}
            <div className="space-y-3 mb-8">
              {sizes.map((size) => (
                <button
                  key={size.code}
                  onClick={() => setSelectedCode(size.code)}
                  className={`
                    w-full h-14 px-5 flex items-center justify-between
                    rounded-[var(--radius-sm)] border transition-all duration-200
                    ${
                      selectedCode === size.code
                        ? "bg-black text-white border-black"
                        : "bg-white/20 text-black border-white/40 hover:bg-white/40 hover:border-white/60"
                    }
                  `}
                >
                  <span className="text-[15px] font-bold">{size.display}</span>
                  {selectedCode === size.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
                    >
                      <Check size={14} className="text-black" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!selectedCode}
              className="w-full h-14 bg-black text-white hover:bg-black/90 rounded-[var(--radius-sm)] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl shadow-black/20"
            >
              <span>تایید و ادامه</span>
              <Check size={18} />
            </button>

            {/* Footer Note */}
            <p className="mt-6 text-[11px] text-center text-black/30 font-medium">
              سایز انتخابی برای نمایش محصول در فضای شما استفاده می‌شود
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SizeSelectionModal;
