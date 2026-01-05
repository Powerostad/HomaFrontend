import { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useScroll, ScrollControls, Image as DreiImage, Preload } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "motion/react";

const IMAGES = [
  "https://images.unsplash.com/photo-1678942046784-3cd8677e9d53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBmYXNoaW9uJTIwZGFyayUyMGFlc3RoZXRpY3xlbnwxfHx8fDE3NjU5MjE2NzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1543829285-a3b7157052a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBkYXJrJTIwbWluaW1hbGlzdHxlbnwxfHx8fDE3NjU5MjE2Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1593542091381-8579f854507e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZW9uJTIwbm9pciUyMHBvcnRyYWl0JTIwY2luZW1hdGljfGVufDF8fHx8MTc2NTkyMTY4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1563056584-8d687ebff9cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGFuZCUyMHdoaXRlJTIwYWJzdHJhY3QlMjBzaGFwZXN8ZW58MXx8fHwxNzY0MDg3OTAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1762341154386-fa765c9f2aa5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXR1cmlzdGljJTIwdGVjaG5vbG9neSUyMGRhcmslMjBtb29kfGVufDF8fHx8MTc2NDA4NzkwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000",
];

function GalleryItem({ url, index, total }: { url: string; index: number; total: number }) {
  const ref = useRef<THREE.Group>(null);
  const { width: w, height: h } = useThree((state) => state.viewport);
  const scroll = useScroll();
  
  // Responsive configuration
  const isMobile = w < 5;
  const gap = isMobile ? 2.5 : 4;
  const imageWidth = isMobile ? 2 : 3;
  const imageHeight = isMobile ? 3 : 4;
  
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Calculate infinite scroll position
    const y = scroll.range(0, 1 / total); // Not used for horizontal, but kept for ref
    
    // We want to move elements based on scroll offset
    // offset is between 0 and 1
    const offset = scroll.offset;
    const scrollPos = offset * total * gap;
    
    // Initial position based on index
    let x = (index * gap) - scrollPos;
    
    // Wrap around logic for infinite feel
    const galleryWidth = total * gap;
    
    // If element is too far left, move it to the right
    while (x < -gap * 2) {
      x += galleryWidth;
    }
    // If element is too far right, move it to the left (though scrolling is usually 0->1)
    while (x > galleryWidth - gap * 2) {
        x -= galleryWidth;
    }
    
    // Center the gallery
    const centerOffset = isMobile ? 0 : w / 4;
    ref.current.position.x = x + centerOffset;

    // Optional: add some parallax or scaling effect based on distance to center
    const distFromCenter = Math.abs(x + centerOffset);
    const scale = THREE.MathUtils.lerp(1, 0.85, distFromCenter * 0.15);
    // Clamp scale
    const clampedScale = Math.max(0.5, Math.min(1.1, scale));
    
    ref.current.scale.set(clampedScale, clampedScale, 1);
    
    // Fade out elements on edges
    const opacity = THREE.MathUtils.lerp(1, 0.2, distFromCenter * 0.3);
    if (ref.current.children[0] && (ref.current.children[0] as any).material) {
        ((ref.current.children[0] as any).material as THREE.Material).opacity = Math.max(0, opacity);
    }
  });

  return (
    <group ref={ref}>
      <DreiImage 
        url={url} 
        scale={[imageWidth, imageHeight, 1]} 
        transparent 
        side={THREE.DoubleSide}
        onError={() => console.warn(`Failed to load texture: ${url}`)}
      />
    </group>
  );
}

function GalleryScene() {
  const { width } = useThree((state) => state.viewport);
  // Repeat images to ensure smooth infinite scrolling
  const items = useMemo(() => [...IMAGES, ...IMAGES, ...IMAGES], []); 

  return (
    <ScrollControls horizontal damping={4} pages={items.length / 5} infinite>
       {items.map((url, i) => (
         <GalleryItem key={`${url}-${i}`} url={url} index={i} total={items.length} />
       ))}
    </ScrollControls>
  );
}

export function ThreeDGalleryPhotography() {
  return (
    <div className="w-full h-screen bg-black relative">
       {/* Overlay Content */}
       <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-6 md:p-12 flex flex-col justify-between">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mix-blend-difference" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              گالری تصاویر
            </h1>
            <p className="text-white/60 text-sm md:text-lg mt-2 max-w-md mix-blend-difference" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              تجربه‌ای متفاوت از نمایش محصولات با جزئیات دقیق و نورپردازی هوشمند.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex justify-between items-end"
          >
             <div className="text-white/40 font-mono text-xs">
                SCROLL TO EXPLORE
             </div>
             <div className="text-white/40 font-mono text-xs">
                HOMA STUDIO © 2025
             </div>
          </motion.div>
       </div>

      <Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <GalleryScene />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
