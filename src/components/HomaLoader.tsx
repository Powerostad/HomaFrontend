import { motion } from "motion/react";
import { Logo } from "./Logo";

export function HomaLoader({ message: _message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white" dir="rtl">
      <motion.div 
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="scale-125 md:scale-150"
      >
        <Logo color="black" size="large" />
      </motion.div>
    </div>
  );
}