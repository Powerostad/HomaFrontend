import { useState } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { OptimizedImage } from './OptimizedImage';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  /** Set to true for LCP images (hero section) to prioritize loading */
  priority?: boolean;
  /** Set to true for below-fold images to enable lazy loading */
  lazy?: boolean;
}

export function BeforeAfterSlider({ beforeImage, afterImage, className = '', priority = false, lazy = false }: BeforeAfterSliderProps) {
  const { t } = useTranslation();
  const [sliderPosition, setSliderPosition] = useState(35);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-black has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset ${className}`}
      dir="ltr"
    >
      {/* Before Image (Full) - LCP element when priority is true */}
      <div className="absolute inset-0 w-full h-full">
        <OptimizedImage
          src={beforeImage}
          alt={t('tryOn.result.before')}
          className="w-full h-full object-cover"
          priority={priority}
          lazy={lazy}
        />
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <OptimizedImage
          src={afterImage}
          alt={t('tryOn.result.after')}
          className="w-full h-full object-cover"
          lazy={lazy}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={sliderPosition}
        aria-label={t('landing.hero.compareLabel')}
        onChange={event => setSliderPosition(event.currentTarget.valueAsNumber)}
        className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 touch-pan-y"
      />

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-[1px] cursor-ew-resize z-20"
        style={{ 
          left: `${sliderPosition}%`,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
        aria-hidden="true"
      >
        {/* Handle - Circular with Arrows (Reduced size for minimalist look) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing group shadow-xl transition-all hover:scale-105 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}
        >
          <ChevronsLeftRight className="w-4 h-4 text-black opacity-80" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}