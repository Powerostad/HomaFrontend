import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UnifiedMenu } from "./SidebarMenu";
import { AuthModal } from "./AuthModal";
import { useAuth } from "../context/AppProviders";

interface HeaderProps {
  theme?: "light" | "dark";
  transparent?: boolean;
  disableNavigation?: boolean;
  hideSpacer?: boolean;
}

export function Header({
  transparent = false,
  disableNavigation = false,
  hideSpacer = false
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { isLoggedIn, login } = useAuth();
  const { t } = useTranslation();

  const handleAuthSuccess = (
    userData: { id: string; name: string; phone?: string },
    tokens: { access: string; refresh: string }
  ) => {
    login(userData, tokens);
    setIsAuthOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 w-full transition-all duration-500 ${transparent
            ? "bg-transparent border-transparent"
            : "bg-surface-page/90 backdrop-blur-xl border-b"
          }`}
        style={{
          zIndex: 'var(--z-fixed)',
          height: 'var(--header-height)',
          borderColor: transparent ? 'transparent' : 'var(--color-border-default)',
        }}
        dir="rtl"
      >
        <div
          className="h-full border-b transition-colors duration-700"
          style={{ borderColor: transparent ? 'rgba(255,255,255,0.1)' : 'var(--color-border-default)' }}
        >
          <div className="h-full mx-auto px-8 md:px-16 grid grid-cols-3 items-center" style={{ maxWidth: 'var(--max-width-content)' }}>
            {/* Menu Trigger */}
            <div className="flex justify-start">
              {!disableNavigation && (
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className={`p-2 transition-all duration-500 ${transparent ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black hover:scale-110"}`}
                  aria-label={t('nav.menu')}
                  data-ph-capture-attribute-nav="menu"
                >
                  <Menu size={18} strokeWidth={1} />
                </button>
              )}
            </div>

            {/* HOMA Wordmark */}
            <div className="flex justify-center">
              <Link to="/" className="flex items-center" data-ph-capture-attribute-nav="logo">
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
                    <Link to="/account/gallery" data-ph-capture-attribute-nav="account" className={`transition-all duration-500 ${transparent ? "text-white/60 hover:text-white" : "text-black/40 hover:text-black hover:scale-110"}`}>
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