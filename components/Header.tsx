import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Menu, X, Search, Heart, User } from "lucide-react";
import { Logo } from "./Logo";
import { motion, AnimatePresence } from "motion/react";
import { UnifiedMenu } from "./SidebarMenu";
import { AuthModal } from "./AuthModal";
import { useApp } from "../context/AppContext";

interface HeaderProps {
  theme?: "light" | "dark";
  transparent?: boolean;
  disableNavigation?: boolean;
  hideSpacer?: boolean;
}

export function Header({
  theme = "light",
  transparent = false,
  disableNavigation = false,
  hideSpacer = false
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isLoggedIn, user, setUser } = useApp();
  const isLight = theme === "light";
  const isDark = theme === "dark";

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[110] w-full h-[var(--header-height)] md:h-[80px] transition-all duration-500 ${transparent
            ? "bg-transparent border-transparent"
            : "bg-[#F7F7F5]/90 backdrop-blur-xl border-b border-black/[0.03]"
          }`}
        dir="rtl"
      >
        <div
          className={`h-full border-b transition-colors duration-700 ${transparent ? "border-white/10" : "border-black/[0.03]"
            }`}
        >
          <div className="h-full max-w-[1440px] mx-auto px-8 md:px-spacing-2xl grid grid-cols-3 items-center">
            {/* Menu Trigger */}
            <div className="flex justify-start">
              {!disableNavigation && (
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className={`p-2 transition-all duration-500 ${transparent ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black hover:scale-110"}`}
                  aria-label="منو"
                >
                  <Menu size={18} strokeWidth={1} />
                </button>
              )}
            </div>

            {/* HOMA Wordmark */}
            <div className="flex justify-center">
              <Link to="/" className="flex items-center">
                <span
                  className={`text-[20px] md:text-[24px] font-light tracking-[0.4em] uppercase leading-none transition-all duration-700 ${transparent ? "text-white" : "text-black"
                    }`}
                  style={{
                    fontFamily: 'var(--font-family-sf-pro)',
                  }}
                >
                  HOMA
                </span>
              </Link>
            </div>

            {/* Quick Access Profile */}
            <div className="flex justify-end items-center gap-4 md:gap-8">
              {!disableNavigation && (
                <>
                  {isLoggedIn ? (
                    <Link to="/account/gallery" className={`transition-all duration-500 ${transparent ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black hover:scale-110"}`}>
                      <User size={18} strokeWidth={1} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className={`flex items-center gap-2 p-1 transition-all duration-500 ${transparent ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black hover:scale-110"}`}
                    >
                      <User size={18} strokeWidth={1} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Unified Sidebar Menu */}
      <UnifiedMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLoginClick={() => setIsAuthOpen(true)}
      />

      {/* Spacer to prevent content from going under the fixed header */}
      {!transparent && !hideSpacer && <div className="h-[64px] md:h-[80px]" />}
    </>
  );
}