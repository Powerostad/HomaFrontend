import { motion } from "motion/react";
import { ExternalLink, CheckCircle } from "lucide-react";
import type { Product } from "../types/product";

interface ProductChipProps {
  product: Product;
  onShowDetails: () => void;
  compact?: boolean;
}

export function ProductChip({ product, onShowDetails, compact = false }: ProductChipProps) {
  const displayPrice = product.price 
    ? `${product.price.toLocaleString('fa-IR')} ${product.currency}`
    : product.priceRange
    ? `${product.priceRange.min.toLocaleString('fa-IR')} - ${product.priceRange.max.toLocaleString('fa-IR')} ${product.currency}`
    : null;

  if (compact) {
    return (
      <motion.button
        onClick={onShowDetails}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-3 p-3 bg-gray-50/80 backdrop-blur-md rounded-2xl border border-gray-200/50 hover:border-gray-300/70 transition-colors shadow-sm"
      >
        <img 
          src={product.thumbnail} 
          alt={product.name}
          className="w-12 h-12 rounded-xl object-cover border border-gray-200"
        />
        <div className="flex-1 min-w-0 text-right">
          <h4 className="text-gray-900 truncate">{product.name}</h4>
          {displayPrice && (
            <p className="text-gray-600">{displayPrice}</p>
          )}
        </div>
        <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm"
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={product.thumbnail}
              alt={product.name}
              className="w-full h-full rounded-2xl object-cover border border-gray-200"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-gray-900 leading-tight">{product.name}</h3>
              {product.seller.verified && (
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
              )}
            </div>

            <p className="text-gray-600 mb-2">
              {product.seller.name}
              {product.brand && ` • ${product.brand}`}
            </p>

            {displayPrice && (
              <p className="text-gray-900 mb-3">{displayPrice}</p>
            )}

            {/* Variants */}
            {product.selectedVariant && (
              <div className="flex items-center gap-3">
                {product.selectedVariant.color && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">رنگ:</span>
                    <span className="text-gray-900">{product.selectedVariant.color}</span>
                  </div>
                )}
                {product.selectedVariant.size && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">سایز:</span>
                    <span className="text-gray-900">{product.selectedVariant.size}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Details Button */}
        <button
          onClick={onShowDetails}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-purple-600 hover:text-purple-700 transition-colors"
        >
          <span>جزئیات محصول</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}