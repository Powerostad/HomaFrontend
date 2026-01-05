import { Instagram, Send, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer
      className="w-full pt-16 pb-12 px-6 md:px-12 lg:px-24 overflow-hidden relative bg-surface-page text-content-primary border-t"
      style={{ borderColor: 'var(--color-border-default)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col">
        
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-12 lg:gap-24 mb-16 border-b pb-16" style={{ borderColor: 'var(--color-border-default)' }}>
          {/* Top Section: Wordmark & Tagline */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-start max-w-sm">
            <h2
              className="text-[32px] md:text-[42px] font-light tracking-[0.4em] uppercase leading-none mb-8 text-content-primary"
              style={{ fontFamily: 'var(--font-family-sf-pro)' }}
            >
              HOMA
            </h2>
            <p 
              className="text-p font-light leading-relaxed opacity-40"
              style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
            >
              فاصله بین رویا و واقعیت، فقط یک کلیک است. ما کمک می‌کنیم تا نتیجه‌ای مطمئن‌تر، زیباتر و با سلیقه‌تر را در فضای خود تجربه کنید.
            </p>
          </div>

          {/* Middle Section: Links Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-20 w-full lg:w-auto">
            {/* Column 1: دسترسی سریع */}
            <div className="flex flex-col gap-8 items-start lg:items-end">
              <h3 
                className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-80"
              >
                دسترسی سریع
              </h3>
              <ul className="flex flex-col gap-5 text-content-secondary">
                <li><Link to="/" className="hover:text-content-primary transition-colors text-p font-light">خانه</Link></li>
                <li><Link to="/explore" className="hover:text-content-primary transition-colors text-p font-light">فروشگاه‌ها</Link></li>
                <li><Link to="/gallery" className="hover:text-content-primary transition-colors text-p font-light">گالری</Link></li>
              </ul>
            </div>

            {/* Column 2: همکاری */}
            <div className="flex flex-col gap-8 items-start lg:items-end">
              <h3 
                className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-80"
              >
                همکاری
              </h3>
              <ul className="flex flex-col gap-5 text-content-secondary">
                <li>
                  <Link
                    to="/collaboration"
                    className="hover:text-content-primary transition-colors text-p font-light"
                  >
                    همکاری با هما
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: پشتیبانی */}
            <div className="flex flex-col gap-8 items-start md:items-end">
              <h3 
                className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-80"
              >
                پشتیبانی
              </h3>
              <ul className="flex flex-col gap-5 text-start md:text-end text-content-secondary">
                <li><a href="#" className="hover:text-content-primary transition-colors text-p font-light">سوالات متداول</a></li>
                <li><a href="#" className="hover:text-content-primary transition-colors text-p font-light">قوانین و مقررات</a></li>
                <li><Link to="/contact" className="hover:text-content-primary transition-colors text-p font-light">تماس با ما</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-12 relative">
          {/* Social Media & Contact Icons */}
          <div className="flex items-center gap-10 text-content-tertiary">
            <a href="#" aria-label="Instagram" className="hover:scale-110 hover:text-content-primary transition-all duration-500"><Instagram size={20} strokeWidth={1} /></a>
            <a href="#" aria-label="Telegram" className="hover:scale-110 hover:text-content-primary transition-all duration-500"><Send size={20} strokeWidth={1} /></a>
            <a href="#" aria-label="Phone" className="hover:scale-110 hover:text-content-primary transition-all duration-500"><Phone size={20} strokeWidth={1} /></a>
            <a href="#" aria-label="Email" className="hover:scale-110 hover:text-content-primary transition-all duration-500"><Mail size={20} strokeWidth={1} /></a>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-end">
            <p className="text-[10px] tracking-[0.2em] uppercase text-content-tertiary font-light">
              © 2026 Homa Platform. All Rights Reserved.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}