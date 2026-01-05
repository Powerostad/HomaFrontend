import React from "react";
import svgPaths from "../../imports/svg-f9sfbfluw4";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Sparkles, Palette, Maximize2, Star } from "lucide-react";
import { Button } from "../ui/button";

export interface Product {
  id: string;
  name: string;
  seller: { name: string };
  variants: { sizes?: string[], colors?: string[] };
  rating: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  thumbnail: string;
}

interface HorizontalProductCardProps {
  product: Product;
  onTryOn?: () => void;
}

export function HorizontalProductCard({ product, onTryOn }: HorizontalProductCardProps) {
  return (
    <div 
      className="relative transition-all duration-500 group overflow-hidden w-full hover:-translate-y-1" 
      dir="rtl"
      style={{ 
        borderRadius: '32px', // More rounded like the reference
        background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.25) 100%)',
        backdropFilter: 'blur(40px) saturate(150%)',
        WebkitBackdropFilter: 'blur(40px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
      }}
    >
      {/* Liquid Sheen Effect */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: 'linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 70%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 8s infinite linear',
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Organic Blob for depth (Optional, helps visual interest) */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-row items-stretch w-full">
        {/* Image Section - RIGHT side in RTL */}
        <div className="relative w-[130px] sm:w-[170px] shrink-0 p-2 pl-0">
           <div className="w-full h-full rounded-[24px] overflow-hidden relative shadow-sm">
            <ImageWithFallback 
              src={product.thumbnail} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Try On Button Overlay */}
            {onTryOn && (
              <div className="absolute inset-0 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 z-20">
                 {/* Dark Glass Button Backdrop */}
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity" />
                
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onTryOn();
                  }}
                  className="relative !bg-[#1A1A1A] !text-white !border-none !h-9 !px-4 sm:!h-10 sm:!px-5 !rounded-full shadow-lg scale-100 lg:scale-90 lg:group-hover:scale-100 transition-all duration-300 hover:!bg-black hover:scale-105"
                  style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 text-white" />
                  <span className="text-xs sm:text-sm font-medium">تست دکور</span>
                </Button>
              </div>
            )}
           </div>
        </div>

        {/* Content Section - LEFT side in RTL */}
        <div className="flex flex-col flex-1 py-4 pl-5 pr-3 text-right justify-between min-h-[150px] sm:min-h-[160px]">
          {/* Top: Seller & Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-start">
              <span className="text-[10px] sm:text-[11px] text-accent font-bold px-2 py-0.5 sm:py-1 bg-white/40 rounded-full backdrop-blur-sm border border-white/50 shadow-sm">
                {product.seller.name}
              </span>
              {product.discountPercentage && (
                <div className="bg-accent text-white px-1.5 py-0.5 rounded-[6px] flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold leading-none">{product.discountPercentage}٪</span>
                </div>
              )}
            </div>
            <h3 className="text-[#1A1A1A] line-clamp-2 font-bold leading-snug text-sm sm:text-base tracking-tight">
              {product.name}
            </h3>
          </div>

          {/* Middle: Specs/Variants */}
          <div className="flex flex-wrap gap-2 mt-2 justify-start">
             {product.variants?.colors && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/30 rounded-full backdrop-blur-md border border-white/40 transition-colors hover:bg-white/50">
                <Palette className="w-3 h-3 text-gray-600" />
                <span className="text-[10px] text-gray-700 font-medium">{product.variants.colors.length} رنگ</span>
              </div>
            )}
            {product.variants?.sizes && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/30 rounded-full backdrop-blur-md border border-white/40 transition-colors hover:bg-white/50">
                <Maximize2 className="w-3 h-3 text-gray-600" />
                <span className="text-[10px] text-gray-700 font-medium">{product.variants.sizes.length} سایز</span>
              </div>
            )}
          </div>

          {/* Bottom: Price & Rating */}
          <div className="mt-3 pt-3 flex items-end justify-between relative">
             {/* Subtle separator using gradient */}
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />
             
            <div className="flex flex-col items-start text-right">
              {product.originalPrice && (
                <span className="text-[11px] sm:text-[13px] text-gray-400 line-through decoration-red-500/30 mb-0.5 font-medium">
                  {product.originalPrice.toLocaleString()}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-[18px] sm:text-[22px] font-extrabold text-[#1A1A1A] tracking-tight">
                  {product.price.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">تومان</span>
              </div>
            </div>

            {/* Rating Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 backdrop-blur-md shadow-sm rounded-full border border-white/50">
              <span className="text-[11px] font-bold text-[#1A1A1A] pt-0.5">{product.rating}</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}