'use client';

import { useScroll, useTransform, useSpring, motion, useMotionTemplate } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Image {
  src: string;
  alt?: string;
}

interface ZoomParallaxProps {
  images: Image[];
}

export function ZoomParallax({ images }: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement>(null);
  // Default to desktop scale (2) to prevent hydration mismatch
  const [finalScale, setFinalScale] = useState(2);

  useEffect(() => {
    const updateScale = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Mobile: Ends at 3.8 to fill ~95% width
        setFinalScale(3.8);
      } else {
        // Desktop: Ends at 2 to fill ~90% height
        setFinalScale(2);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  // Add physics-based smoothing to the scroll progress
  // This eliminates the "step-by-step" (stuttery) feel on mobile
  // Stiffness/Damping tuned for a "cinematic" weight
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 150, 
    damping: 20,
    mass: 0.5,
    restDelta: 0.001 
  });

  // Global zoom on the entire collage
  // Uses smoothProgress for fluid animation
  const globalScale = useTransform(smoothProgress, [0, 1], [0.6, finalScale]);

  // Professional smooth fade out with blur effect
  // Starts earlier (30%) and finishes before the very end (90%)
  const fadeOut = useTransform(smoothProgress, [0.3, 0.9], [1, 0]);
  const blurValue = useTransform(smoothProgress, [0.3, 0.9], [0, 8]); // 0px to 8px blur
  const blurFilter = useMotionTemplate`blur(${blurValue}px)`;

  // Position configuration (vw based)
  const positions = [
    "h-[25vw] w-[25vw]",
    "top-[-30vw] left-[5vw] h-[30vw] w-[35vw]",
    "top-[-10vw] left-[-25vw] h-[45vw] w-[20vw]",
    "left-[27.5vw] h-[25vw] w-[25vw]",
    "top-[27.5vw] left-[5vw] h-[25vw] w-[20vw]",
    "top-[27.5vw] left-[-22.5vw] h-[25vw] w-[30vw]",
    "top-[22.5vw] left-[25vw] h-[15vw] w-[15vw]",
  ];

  return (
    // Reduced height on mobile (200vh) for faster animation completion
    // Kept 300vh on desktop for standard pacing
    <div ref={container} className="relative h-[200vh] md:h-[300vh] w-full">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden bg-background flex items-center justify-center">
        <motion.div
          style={{ scale: globalScale }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {images.map(({ src, alt }, index) => {
            const positionClass = positions[index] || positions[0];
            const isMain = index === 0;

            return (
              <motion.div
                key={index}
                style={{
                  opacity: isMain ? 1 : fadeOut,
                  filter: isMain ? undefined : blurFilter,
                  zIndex: isMain ? 10 : 1,
                }}
                className="absolute top-0 flex h-full w-full items-center justify-center pointer-events-none"
              >
                <div className={`relative overflow-hidden rounded-[var(--radius-card)] shadow-[var(--elevation-lg)] ${positionClass}`}>
                  <ImageWithFallback
                    src={src || '/placeholder.svg'}
                    alt={alt || `Parallax image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
