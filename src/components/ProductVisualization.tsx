import { useState } from "react";
import { SimpleButton as Button } from "./SimpleButton";
import { motion, AnimatePresence } from "motion/react";
import { Download, RotateCcw, AlertTriangle, Store, Check, X } from "lucide-react";
import { ProductChip } from "./ProductChip";
import { Header } from "./Header";
import type { Product } from "../types/product";
const roomImage = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

interface ProductVisualizationProps {
  product: Product;
  userImage: string;
  fileName: string;
  placementSuccess: boolean;
  onSave: () => void;
  onShare: () => void;
  onChangeVariant: (type: "color" | "size", value: string) => void;
  onTryAnother: () => void;
  onViewProductDetails: () => void;
  onPurchase: () => void;
  onBackToStore: () => void;
}

export function ProductVisualization({
  product,
  userImage,
  fileName,
  placementSuccess,
  onSave,
  onShare,
  onChangeVariant,
  onTryAnother,
  onViewProductDetails,
  onPurchase,
  onBackToStore
}: ProductVisualizationProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSave = () => {
    onSave();
    setIsSaved(true);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showBackButton={false} />

      <div className="pt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto px-6 py-6"
        >
          {/* Title */}
          <div className="mb-4">
            <h2 className="font-bold text-center text-[20px]">تصویر نهایی</h2>
          </div>

          {/* Preview Image */}
          <div className="relative mb-6">
            <div
              className="w-full aspect-square rounded-3xl overflow-hidden relative cursor-pointer transition-all duration-300 hover:shadow-lg"
              onClick={openFullscreen}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFullscreen();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="کلیک کنید برای مشاهده تمام صفحه"
            >
              {/* Room Image - Clean, no overlays */}
              <img
                src={roomImage}
                alt="تصویر نهایی اتاق شما"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info Compact */}
          <div className="pb-4 mt-4">
            <ProductChip
              product={product}
              onShowDetails={onViewProductDetails}
              compact
            />
          </div>

          {/* Actions */}
          <div className="pb-6">
            {placementSuccess ? (
              <>
                {/* Save Button - Full Width */}
                {!isSaved ? (
                  <Button
                    onClick={handleSave}
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl flex items-center justify-center gap-2 mb-4"
                  >
                    <Download className="w-5 h-5" />
                    ذخیره عکس
                  </Button>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full h-14 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-2 mb-4"
                  >
                    <Check className="w-5 h-5" />
                    ذخیره شد
                  </motion.div>
                )}

                {/* Secondary Actions */}
                <div className="space-y-2">
                  <button
                    onClick={onTryAnother}
                    className="w-full flex items-center justify-center gap-2 py-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    امتحان عکس دیگر
                  </button>

                  <button
                    onClick={onBackToStore}
                    className="w-full flex items-center justify-center gap-2 py-3 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Store className="w-4 h-4" />
                    بازگشت به پیج فروشگاه
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Failed Placement Actions */}
                <Button
                  onClick={onTryAnother}
                  className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors mb-3"
                >
                  <RotateCcw className="w-5 h-5 ml-2" />
                  عکس بهتری آپلود کنید
                </Button>

                <Button
                  onClick={onSave}
                  variant="outline"
                  className="w-full h-14 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full"
                >
                  ادامه به هر حال (بتا)
                </Button>

                {/* Improvement Tips */}
                <div className="mt-4 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                  <p className="text-yellow-900 mb-2">💡 نکات بهبود عکس:</p>
                  <ul className="text-yellow-800 space-y-1 mr-4">
                    <li>• نور کافی داشته باشه</li>
                    <li>• کل اتاق یا دیوار رو نشون بده</li>
                    <li>• عکس واضح و بدون تاری باشه</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeFullscreen}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label="نمایش تصویر تمام صفحه"
            tabIndex={-1}
          >
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-6 left-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 focus-ring"
              aria-label="بستن نمای تمام صفحه"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Fullscreen Image */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full p-6 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={roomImage}
                alt="تصویر نهایی اتاق ش��ا - نمای تمام صفحه"
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>

            {/* Hint Text */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-center">
              <p>کلیک کنید یا ESC بزنید برای بستن</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}