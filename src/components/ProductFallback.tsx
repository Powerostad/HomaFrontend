import { SimpleButton as Button } from "./SimpleButton";
import { motion } from "motion/react";
import { AlertCircle, ArrowRight } from "lucide-react";
import type { Product } from "../types/product";

interface ProductFallbackProps {
  reason: "not_found" | "inactive" | "out_of_stock" | "error";
  suggestedProducts?: Product[];
  onSelectProduct: (productId: string) => void;
  onUploadForSuggestions: () => void;
}

export function ProductFallback({ 
  reason, 
  suggestedProducts = [],
  onSelectProduct,
  onUploadForSuggestions
}: ProductFallbackProps) {
  const getMessage = () => {
    switch (reason) {
      case "not_found":
        return {
          title: "محصول یافت نشد",
          message: "متأسفانه این محصول در سیستم ما موجود نیست.",
          icon: "❌"
        };
      case "inactive":
        return {
          title: "محصول غیرفعال شده",
          message: "این محصول دیگر در دسترس نیست.",
          icon: "⚠️"
        };
      case "out_of_stock":
        return {
          title: "محصول موجود نیست",
          message: "این محصول فعلاً موجود نمی‌باشد.",
          icon: "📦"
        };
      default:
        return {
          title: "خطا در بارگذاری محصول",
          message: "مشکلی پیش آمده. لطفاً دوباره تلاش کنید.",
          icon: "⚠️"
        };
    }
  };

  const content = getMessage();

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-gray-100">
          <h3 className="text-gray-900">هوم ویژن</h3>
        </div>

        {/* Error State */}
        <div className="p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-6"
          >
            <div className="text-6xl mb-4">{content.icon}</div>
            <h2 className="text-gray-900 mb-2">{content.title}</h2>
            <p className="text-gray-600 leading-relaxed">
              {content.message}
            </p>
          </motion.div>

          {/* Suggested Products */}
          {suggestedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <h3 className="text-gray-900 mb-4">محصولات مشابه</h3>
              <div className="space-y-3">
                {suggestedProducts.slice(0, 3).map((product) => (
                  <motion.button
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectProduct(product.id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-colors"
                  >
                    <img 
                      src={product.thumbnail}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="text-gray-900 truncate">{product.name}</h4>
                      <p className="text-gray-600">{product.seller.name}</p>
                      {product.price && (
                        <p className="text-gray-900">
                          {product.price.toLocaleString('fa-IR')} {product.currency}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 rotate-180" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Upload for Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 mb-6"
          >
            <div className="text-center mb-4">
              <p className="text-gray-900 mb-2">عکس اتاقت رو آپلود کن</p>
              <p className="text-gray-600">
                محصولات مشابه رو روی اتاقت نشونت می‌دیم
              </p>
            </div>
            <Button
              onClick={onUploadForSuggestions}
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
            >
              آپلود عکس
            </Button>
          </motion.div>

          {/* Info */}
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-900 mb-1">نیاز به کمک؟</p>
                <p className="text-blue-700">
                  با پشتیبانی تماس بگیرید یا به صفحه اصلی برگردید.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}