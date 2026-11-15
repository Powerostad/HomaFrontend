import { useSiteTranslation } from '@/i18n/siteCopy';
import { Sparkles } from "lucide-react";
import type { Product } from "../../types/product";
import { formatPriceFromRial, formatPriceStartingFrom } from "../../utils/formatters";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface GalleryProductCardProps {
  product: Product;
  onTryOn?: () => void;
}

export function GalleryProductCard({ product, onTryOn }: GalleryProductCardProps) {
  const { siteText, siteValue, siteDirection } = useSiteTranslation();
  return (
    <div className="flex flex-col group cursor-pointer w-full" dir={siteDirection()}>
      {/* Editorial Style: Sharp Corners (rounded-none) */}
      <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02] transition-all duration-500">
        <ImageWithFallback 
          src={product.thumbnail} 
          alt={siteValue(product.name)}
          className="w-full h-full object-cover grayscale-[0.05] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]"
        />
        
        {/* Quick Action (Desktop Hover) - Editorial Sharp Button */}
        {siteValue(onTryOn && (
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hidden md:block">
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onTryOn();
                }}
                className="flex items-center gap-2 h-10 px-4 rounded-none bg-white/95 backdrop-blur-md border border-black/5 text-black shadow-sm hover:bg-black hover:text-white transition-all"
              >
                <Sparkles size={12} className="opacity-60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{siteText("امتحان")}</span>
              </button>
          </div>
        ))}
      </div>

      {/* 4) Text Under Tile - Invisible UI approach */}
      {/* 1) Image-to-text gap: 12px (pt-3) */}
      <div className="flex flex-col pt-3 px-0">
        {/* Product Name: Editorial Typography */}
        <h3 className="text-[13px] md:text-[15px] font-medium text-black/70 line-clamp-1 leading-tight group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
          {siteValue(product.name)}
        </h3>
        
        {/* Price: Minimalist, Muted Grey */}
        <div className="flex items-center gap-1.5 mt-2 text-black/30">
          {siteValue(product.priceRange ? (
            <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              {siteValue(formatPriceStartingFrom(product.priceRange.min))}
            </span>
          ) : (
            <>
              <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-tight">
                {siteValue(formatPriceFromRial(product.price ?? 0, false))}
              </span>
              <span className="text-[10px] md:text-[11px] font-medium opacity-60">{siteText("تومان")}</span>
            </>
          ))}
        </div>

        {/* Rating removed from grid as per spec */}
      </div>
    </div>
  );
}
