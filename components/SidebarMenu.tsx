import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Home, 
  ShoppingBag, 
  Image as ImageIcon, 
  Info, 
  Phone,
  ArrowLeft,
  Settings,
  Shield,
  MessageSquare,
  LogOut,
  Palette,
  User,
  ChevronLeft,
  LayoutGrid
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { AuthModal } from "./AuthModal";
import { createPortal } from "react-dom";

interface UnifiedMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void; // Made optional
}

export function UnifiedMenu({ isOpen, onClose, onLoginClick }: UnifiedMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, setUser } = useApp() as any;
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);

  const navItems = [
    { label: "خانه", href: "/", icon: Home },
    { label: "فروشگاه‌ها", href: "/explore", icon: ShoppingBag },
    { label: "استودیو هُما", href: "/studio/upload", icon: Palette },
  ];

  const accountItems = [
    { label: "پروژه‌های استودیو", desc: "مدیریت طراحی‌های من", href: "/studio/projects", icon: LayoutGrid },
    { label: "گالری من", desc: "نتایج Try-On", href: "/account/gallery", icon: ImageIcon },
    { label: "تنظیمات", desc: "حساب کاربری", href: "/account/settings", icon: Settings },
  ];

  const handleLogout = () => {
    if (window.confirm('آیا از خروج از حساب خود مطمئن هستید؟')) {
      setUser(null);
      onClose();
      navigate('/');
    }
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
            className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-[var(--bg-page)] z-[9999] shadow-none border-l border-[var(--border-subtle)] flex flex-col overflow-hidden font-vazirmatn"
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
                   <div className="text-[28px] font-light tracking-tight text-[var(--jet-black)]">
                      سلام، <span className="font-bold">{user?.name?.split(' ')[0] || 'کاربر'}</span>
                   </div>
                   <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                      <span>{user?.phone}</span>
                      <div className="w-4 h-[1px] bg-[var(--border-subtle)]" />
                      <button onClick={handleLogout} className="hover:text-accent transition-colors">خروج</button>
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
                  <span className="text-[28px] font-light tracking-tight text-[var(--jet-black)] block group-hover:translate-x-[-10px] transition-transform duration-500">ورود به حساب</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent mt-2 block">Login / Register</span>
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
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--muted-foreground)] block">My Space</span>
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
                      <Link to="/about" onClick={onClose} className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--jet-black)] hover:text-accent transition-colors">درباره ما</Link>
                      <Link to="/contact" onClick={onClose} className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--jet-black)] hover:text-accent transition-colors">تماس با ما</Link>
                      <Link to="/faq" onClick={onClose} className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--jet-black)] hover:text-accent transition-colors">سوالات متداول</Link>
                   </div>
                </div>
              </div>
            </div>

            {/* 3. Footer Area */}
            <div className="flex-shrink-0 p-8 border-t border-[var(--border-subtle)] bg-[var(--bg-page)]">
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
              onSuccess={(userData) => {
                setUser(userData);
                setIsAuthOpen(false);
              }} 
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