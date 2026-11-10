import { useSiteTranslation } from '@/i18n/siteCopy';
import { CheckCircle, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import type { Product } from "../types/product";

interface ProductChipProps {
  product: Product;
  onShowDetails: () => void;
  compact?: boolean;
}

export function ProductChip({ product, onShowDetails, compact = false }: ProductChipProps) {
  const { siteText, siteValue, siteLocale } = useSiteTranslation();
  const displayPrice = product.price 
    ? `${product.price.toLocaleString(siteLocale())} ${product.currency}`
    : product.priceRange
    ? `${product.priceRange.min.toLocaleString(siteLocale())} - ${product.priceRange.max.toLocaleString(siteLocale())} ${product.currency}`
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
          alt={siteValue(product.name)}
          className="w-12 h-12 rounded-xl object-cover border border-gray-200"
        />
        <div className="flex-1 min-w-0 text-right">
          <h4 className="text-gray-900 truncate">{siteValue(product.name)}</h4>
          {siteValue(displayPrice && (
            <p className="text-gray-600">{siteValue(displayPrice)}</p>
          ))}
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
              alt={siteValue(product.name)}
              className="w-full h-full rounded-2xl object-cover border border-gray-200"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-gray-900 leading-tight">{siteValue(product.name)}</h3>
              {siteValue(product.seller.verified && (
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
              ))}
            </div>

            <p className="text-gray-600 mb-2">
              {siteValue(product.seller.name)}
              {siteValue(product.brand && ` • ${product.brand}`)}
            </p>

            {siteValue(displayPrice && (
              <p className="text-gray-900 mb-3">{siteValue(displayPrice)}</p>
            ))}

            {/* Variants */}
            {siteValue(product.selectedVariant && (
              <div className="flex items-center gap-3">
                {siteValue(product.selectedVariant.color && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">{siteText("رنگ:")}</span>
                    <span className="text-gray-900">{siteValue(product.selectedVariant.color)}</span>
                  </div>
                ))}
                {siteValue(product.selectedVariant.size && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">{siteText("سایز:")}</span>
                    <span className="text-gray-900">{siteValue(product.selectedVariant.size)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Details Button */}
        <button
          onClick={onShowDetails}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-purple-600 hover:text-purple-700 transition-colors"
        >
          <span>{siteText("جزئیات محصول")}</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}