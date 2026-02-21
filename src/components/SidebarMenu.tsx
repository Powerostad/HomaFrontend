import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Home,
  ShoppingBag,
  Image as ImageIcon,
  Settings,
  Palette,
  LayoutGrid,
  Globe
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AppProviders";
import { AuthModal } from "./AuthModal";
import { createPortal } from "react-dom";
import type { User } from "../context/AuthContext";
import { languages, updateDocumentLanguage, type LanguageCode } from "@/i18n/config";

interface UnifiedMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void; // Made optional
}

export function UnifiedMenu({ isOpen, onClose, onLoginClick }: UnifiedMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout, login } = useAuth();
  const { t, i18n } = useTranslation();
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = React.useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: LanguageCode) => {
    i18n.changeLanguage(langCode);
    updateDocumentLanguage(langCode);
    setIsLanguageOpen(false);
  };

  const navItems = [
    { label: t('nav.home'), href: "/", icon: Home, navId: "home" },
    { label: t('nav.stores'), href: "/explore", icon: ShoppingBag, navId: "explore" },
    { label: t('nav.studio'), href: "/studio/upload", icon: Palette, navId: "studio" },
  ];

  const accountItems = [
    { label: t('nav.myProjects'), desc: t('studio.myProjects'), href: "/studio/projects", icon: LayoutGrid },
    { label: t('nav.myGallery'), desc: t('tryOn.result'), href: "/account/gallery", icon: ImageIcon },
    { label: t('nav.settings'), desc: t('account.title'), href: "/account/settings", icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      logout();
      onClose();
      navigate('/');
    }
  };

  const handleAuthSuccess = (
    userData: User,
    tokens: { access: string; refresh: string }
  ) => {
    login(userData, tokens);
    setIsAuthOpen(false);
  };

  // Render the menu using a Portal to ensure it's on top of everything
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9998]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-surface-default z-[9999] shadow-none border-l border-[var(--border-subtle)] flex flex-col overflow-hidden font-vazirmatn"
            dir="rtl"
          >
            {/* 1. Header Area - Zara Style */}
            <div className="flex-shrink-0 px-8 py-12 flex flex-col gap-12">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-[var(--jet-black)] opacity-40">Menu</span>
                <button 
                  onClick={onClose}
                  className="p-1 text-[var(--jet-black)] hover:text-accent transition-colors"
                >
                  <X size={20} strokeWidth={1} />
                </button>
              </div>

              {isLoggedIn ? (
                <div className="space-y-2">
                   <div className="text-[28px] font-light tracking-tight text-[var(--jet-black)]" data-ph-mask>
                      {t('auth.greeting', { name: user?.name?.split(' ')[0] || t('common.user') })}
                   </div>
                   <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      <span data-ph-mask>{user?.phone}</span>
                      <div className="w-4 h-[1px] bg-[var(--border-subtle)]" />
                      <button onClick={handleLogout} className="hover:text-accent transition-colors">{t('auth.logout')}</button>
                   </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onLoginClick) {
                      onClose();
                      onLoginClick();
                    } else {
                      setIsAuthOpen(true);
                    }
                  }}
                  className="text-start group"
                >
                  <span className="text-[28px] font-light tracking-tight text-[var(--jet-black)] block group-hover:translate-x-[-10px] transition-transform duration-500">{t('auth.loginToAccount')}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent mt-2 block">{t('auth.login')} / {t('auth.register')}</span>
                </button>
              )}
            </div>

            {/* 2. Navigation Content - Vertical Editorial Flow */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-8 pb-12">
              <div className="space-y-16">
                {/* Section: Main Links */}
                <div className="space-y-8">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className="block group"
                        data-ph-capture-attribute-nav={item.navId}
                      >
                        <div className="flex items-baseline gap-4">
                           <span className={`text-[24px] md:text-[32px] font-light tracking-tight transition-all duration-500 group-hover:translate-x-[-8px] ${
                             isActive ? 'text-accent' : 'text-[var(--jet-black)]'
                           }`}>
                             {item.label}
                           </span>
                           {isActive && <div className="w-2 h-2 rounded-full bg-accent" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Section: Personal Area */}
                {isLoggedIn && (
                  <div className="space-y-10 pt-10 border-t border-[var(--border-subtle)]">
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--muted-foreground)] block">{t('nav.mySpace')}</span>
                    <div className="space-y-8">
                      {accountItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={onClose}
                            className="block group"
                          >
                             <div className="flex flex-col gap-1">
                                <span className={`text-[18px] font-light transition-all duration-500 group-hover:translate-x-[-6px] ${
                                  isActive ? 'text-accent' : 'text-[var(--jet-black)]'
                                }`}>
                                   {item.label}
                                </span>
                                <span className="text-[11px] text-[var(--muted-foreground)] opacity-60 font-medium">
                                   {item.desc}
                                </span>
                             </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section: Secondary Info */}
                <div className="pt-10 border-t border-[var(--border-subtle)] space-y-6">
                   <div className="flex flex-col gap-4">
                      <Link to="/about" onClick={onClose} className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--jet-black)] hover:text-accent transition-colors">{t('nav.aboutUs')}</Link>
                      <Link to="/contact" onClick={onClose} className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--jet-black)] hover:text-accent transition-colors">{t('nav.contactUs')}</Link>
                      <Link to="/faq" onClick={onClose} className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--jet-black)] hover:text-accent transition-colors">{t('nav.faq')}</Link>
                   </div>
                </div>
              </div>
            </div>

            {/* 3. Footer Area with Language Switcher */}
            <div className="flex-shrink-0 p-8 border-t border-[var(--border-subtle)] bg-surface-default space-y-4">
               {/* Language Switcher */}
               <div className="relative">
                  <button
                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                    className="flex items-center gap-2 text-[12px] font-medium text-[var(--jet-black)] hover:text-accent transition-colors w-full"
                  >
                    <Globe size={16} strokeWidth={1.5} />
                    <span>{currentLanguage.name}</span>
                  </button>
                  {isLanguageOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-elevated border border-[var(--border-subtle)] rounded-lg shadow-lg overflow-hidden">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full px-4 py-3 text-start text-[13px] hover:bg-surface-muted transition-colors flex justify-between items-center ${
                            lang.code === i18n.language ? 'bg-surface-muted text-accent' : 'text-[var(--jet-black)]'
                          }`}
                          style={{
                            fontFamily: lang.dir === 'rtl' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif',
                          }}
                        >
                          <span>{lang.name}</span>
                          {lang.code === i18n.language && <span className="text-accent">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
               </div>

               {/* Version Info */}
               <div className="flex justify-between items-center opacity-40">
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Homa Edition 2026</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em]">v4.0</span>
               </div>
            </div>
          </motion.div>
          
          {/* Internal Auth Modal if no external handler provided */}
          {!onLoginClick && (
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => setIsAuthOpen(false)}
              onSuccess={handleAuthSuccess}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Export as SidebarMenu for compatibility with existing imports
export { UnifiedMenu as SidebarMenu };