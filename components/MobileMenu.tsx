import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Logo } from "./Logo";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuItems = [
    { label: "فروشگاه‌ها", href: "/explore" },
    { label: "بلاگ", href: "/blog" },
    { label: "قیمت‌ها", href: "/pricing" },
    { label: "درباره ما", href: "/about" },
    { label: "ورود", href: "/login" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] p-4 flex flex-col items-center">
          {/* Backdrop Overlay (Optional, based on ref it's more like a modal/card) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/10 backdrop-blur-sm"
          />

          {/* Menu Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-7xl bg-white rounded-[32px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col"
          >
            {/* Subtle Gradient at Top Edge */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-400/10 via-green-400/10 to-purple-400/10 pointer-events-none" />

            {/* Top Bar (Inside Menu) */}
            <div className="flex items-center justify-between px-6 h-[72px]">
              {/* Logo on Left */}
              <div className="flex items-center">
                <Logo />
              </div>

              {/* Close Button on Right */}
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-black hover:bg-zinc-100 rounded-full transition-colors"
                aria-label="بستن منو"
              >
                <X size={24} />
              </button>
            </div>

            {/* Menu Links */}
            <nav className="flex flex-col gap-6 px-8 py-6">
              {menuItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="text-[24px] font-bold text-black text-right"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                  onClick={onClose}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>

            {/* Bottom Button */}
            <div className="p-8 pt-4">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full bg-black text-white h-[56px] rounded-[18px] text-[17px] font-bold shadow-[0_12px_24px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300"
                style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
              >
                ثبت‌نام رایگان
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}