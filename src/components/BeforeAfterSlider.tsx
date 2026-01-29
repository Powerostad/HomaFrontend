import { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

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
  const [sliderPosition, setSliderPosition] = useState(35); // Default to 35% so it's not dead center
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleStart = () => {
    setIsDragging(true);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-black ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Before Image (Full) - LCP element when priority is true */}
      <div className="absolute inset-0 w-full h-full">
        <OptimizedImage
          src={beforeImage}
          alt="قبل"
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
          alt="بعد"
          className="w-full h-full object-cover"
          lazy={lazy}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-[1px] cursor-ew-resize z-20"
        style={{ 
          left: `${sliderPosition}%`,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
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