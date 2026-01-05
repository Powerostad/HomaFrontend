import React from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export function FinalCTA({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="w-full bg-white py-16 md:py-48 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto relative group cursor-pointer" onClick={onGetStarted}>
        <div className="relative aspect-[16/7] md:aspect-[21/9] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover brightness-[0.85] transition-transform duration-[3s] ease-out group-hover:scale-105"
            alt="Interior Inspiration"
          />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10"
            >
              <h2 
                className="text-[32px] md:text-[64px] font-light text-white leading-tight tracking-tight max-w-4xl"
                style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
              >
                فضایِ متمایزِ خود را <br />
                <span className="italic opacity-80">همین امروز خلق کنید.</span>
              </h2>
              
              <div className="flex justify-center">
                <button 
                  className="bg-white text-[#292b2d] px-12 py-5 text-[15px] font-medium tracking-[0.2em] uppercase hover:bg-[#292b2d] hover:text-white transition-all duration-700"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  شروع تجربه هوشمند
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}