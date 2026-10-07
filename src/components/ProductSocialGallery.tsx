import { useSiteTranslation } from '@/i18n/siteCopy';
/**
 * ProductSocialGallery Component
 *
 * Displays user-submitted try-on images for a product as social proof.
 * Shows how other users have styled the product in their spaces.
 */

import { fetchProductGallery, type PublicGalleryItem } from '@/services/socialGalleryService';
import { ChevronLeft, ChevronRight, Loader2, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductSocialGalleryProps {
  productId: string | number;
  productName?: string;
  className?: string;
}

export function ProductSocialGallery({
  productId,
  productName: _productName,
  className = ''
}: ProductSocialGalleryProps) {
  const { siteText, siteValue, siteDirection, siteLocale } = useSiteTranslation();
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Fetch gallery items on mount
  useEffect(() => {
    const loadGallery = async () => {
      setIsLoading(true);
      setError(null);

      const result = await fetchProductGallery(productId, { pageSize: 12 });

      if (result.success && result.data) {
        setItems(result.data.items);
      } else {
        setError(result.error || null);
      }

      setIsLoading(false);
    };

    loadGallery();
  }, [productId]);

  // Don't render anything if no items and not loading
  if (!isLoading && items.length === 0) {
    return null;
  }

  // Navigate lightbox
  const showPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const showNext = () => {
    if (selectedIndex !== null && selectedIndex < items.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <div className={`${className}`} dir={siteDirection()}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
            <Users size={18} className="text-black/60" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-black">
              {siteText("کاربران امتحان کردند")}</h3>
            <p className="text-[12px] text-black/50">
              {siteValue(items.length > 0 ? siteText("{{v0}} تصویر از کاربران", { v0: items.length }) : siteText("در حال بارگذاری..."))}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {siteValue(isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-black/30" />
        </div>
      ))}

      {/* Error State */}
      {siteValue(error && !isLoading && (
        <div className="text-center py-8 text-black/40 text-[13px]">
          {siteValue(error)}
        </div>
      ))}

      {/* Gallery Grid */}
      {siteValue(!isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {siteValue(items.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square bg-black/5 overflow-hidden group"
            >
              <ImageWithFallback
                src={item.thumbnailUrl || item.imageUrl}
                alt={siteText("تصویر از کاربر")}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </motion.button>
          )))}
        </div>
      ))}

      {/* Lightbox */}
      <AnimatePresence>
        {siteValue(selectedIndex !== null && items[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
            >
              <X size={24} />
            </button>

            {/* Navigation Buttons */}
            {siteValue(selectedIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); showPrevious(); }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronLeft size={24} />
              </button>
            ))}
            {siteValue(selectedIndex < items.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); showNext(); }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10"
              >
                <ChevronRight size={24} />
              </button>
            ))}

            {/* Main Image */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-[90vw] max-h-[80vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithFallback
                src={items[selectedIndex].imageUrl}
                alt={siteText("تصویر {{v0}}", { v0: selectedIndex + 1 })}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <span className="text-[12px] opacity-70">
                    {siteValue(new Date(items[selectedIndex].submittedAt).toLocaleDateString(siteLocale()))}
                  </span>
                  <span className="text-[12px] font-medium">
                    {siteValue(selectedIndex + 1)} / {siteValue(items.length)}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
