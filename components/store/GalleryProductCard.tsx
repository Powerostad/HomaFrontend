import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Sparkles, Star } from "lucide-react";
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

interface GalleryProductCardProps {
  product: Product;
  onTryOn?: () => void;
}

export function GalleryProductCard({ product, onTryOn }: GalleryProductCardProps) {
  return (
    <div className="flex flex-col group cursor-pointer w-full" dir="rtl">
      {/* Editorial Style: Sharp Corners (rounded-none) */}
      <div className="relative aspect-[4/5] w-full rounded-none overflow-hidden bg-black/[0.02] transition-all duration-500">
        <ImageWithFallback 
          src={product.thumbnail} 
          alt={product.name} 
          className="w-full h-full object-cover grayscale-[0.05] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.02]"
        />
        
        {/* Quick Action (Desktop Hover) - Editorial Sharp Button */}
        {onTryOn && (
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hidden md:block">
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onTryOn();
                }}
                className="flex items-center gap-2 h-10 px-4 rounded-none bg-white/95 backdrop-blur-md border border-black/5 text-black shadow-sm hover:bg-black hover:text-white transition-all"
              >
                <Sparkles size={12} className="opacity-60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]">امتحان</span>
              </button>
          </div>
        )}
      </div>

      {/* 4) Text Under Tile - Invisible UI approach */}
      {/* 1) Image-to-text gap: 12px (pt-3) */}
      <div className="flex flex-col pt-3 px-0">
        {/* Product Name: Editorial Typography */}
        <h3 className="text-[13px] md:text-[15px] font-medium text-black/70 line-clamp-1 leading-tight group-hover:text-black transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
          {product.name}
        </h3>
        
        {/* Price: Minimalist, Muted Grey */}
        <div className="flex items-center gap-1.5 mt-2 text-black/30">
          <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-tight">
            {toPersianDigits(product.price.toLocaleString())}
          </span>
          <span className="text-[10px] md:text-[11px] font-medium opacity-60">تومان</span>
        </div>

        {/* Rating removed from grid as per spec */}
      </div>
    </div>
  );
}

// Helper for Persian Digits
const toPersianDigits = (value: number | string) => {
  if (value === undefined || value === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return value
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};