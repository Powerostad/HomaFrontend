import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, ArrowRight, User, ShoppingBag, Instagram, Phone, Box, AlignLeft, ChevronDown, ArrowLeft, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export function CollaborationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    phone: '',
    instagramId: '',
    website: '',
    productType: '',
    description: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Collaboration Request:', formData);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col" dir="rtl">
      {/* Editorial Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[150] opacity-[0.03] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <Header showBackButton={true} onBack={() => navigate(-1)} theme="dark" />
      
      <main className="flex-grow flex flex-col md:flex-row relative z-10 pt-20">
        {/* Left Side: Editorial Image (Sticky on Desktop) - Hidden on mobile */}
        <div className="hidden md:block md:w-1/2 md:h-screen md:sticky md:top-0">
          <div className="w-full h-full p-6 md:p-12">
            <div className="relative w-full h-full overflow-hidden rounded-[2px]">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBpbnRlcmlvciUyMGRlc2lnbiUyMHNob3dyb29tJTIwZnVybml0dXJlJTIwZGlnaXRhbCUyMG1vY2t1cHxlbnwxfHx8fDE3NjcyMjI0MjB8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Partnering with Homa"
                className="w-full h-full object-cover grayscale-[0.1] hover:scale-105 transition-transform duration-[3s] ease-out"
              />
              <div className="absolute inset-0 bg-black/5" />
              
              {/* Floating Label */}
              <div className="absolute bottom-10 right-10 flex flex-col items-end text-white space-y-2">
                <span className="text-[10px] tracking-[0.3em] font-medium uppercase opacity-80 shadow-sm">Digital Showroom</span>
                <div className="w-12 h-[1px] bg-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center py-12 md:py-24 px-6 md:px-20 lg:px-32">
          {!isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl w-full"
            >
              <div className="mb-16 space-y-6">
                <h1 
                  className="text-[42px] md:text-[56px] font-light text-[#292b2d] leading-[1.1] tracking-tighter"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  محصولات شما، <br /> در خانه‌ی مشتریان ما.
                </h1>
                <p className="text-[#292b2d]/60 text-[18px] leading-relaxed max-w-md">
                  با پیوستن به اکوسیستم هُما، محصولات خود را به صورت هوشمند در فضاهای واقعی به نمایش بگذارید.
                </p>
                <div className="flex gap-4">
                   <button className="flex items-center gap-2 text-[13px] font-bold text-accent border-b border-accent/20 pb-1 hover:border-accent transition-all">
                      <LayoutTemplate size={16} />
                      <span>دیدن نمونه همکاری‌ها</span>
                   </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  {/* Two Column Layout for Name and Shop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <label 
                        className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      >
                        نام و نام خانوادگی
                      </label>
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="مثلاً علی علوی"
                        className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all placeholder:text-[#757575]"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      />
                    </div>

                    {/* Shop Name */}
                    <div className="space-y-2">
                      <label 
                        className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      >
                        نام فروشگاه / برند
                      </label>
                      <input
                        required
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        placeholder="مثلاً مبلمان آریا"
                        className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all placeholder:text-[#757575]"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div className="space-y-2">
                      <label 
                        className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      >
                        شماره تماس
                      </label>
                      <input
                        required
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                        className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all text-left dir-ltr placeholder:text-[#757575]"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      />
                    </div>

                    {/* Instagram ID */}
                    <div className="space-y-2">
                      <label 
                        className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      >
                        آیدی اینستاگرام (اختیاری)
                      </label>
                      <input
                        type="text"
                        name="instagramId"
                        value={formData.instagramId}
                        onChange={handleChange}
                        placeholder="@homa_platform"
                        className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all text-left dir-ltr placeholder:text-[#757575]"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      />
                    </div>
                  </div>

                  {/* Website Address */}
                  <div className="space-y-2">
                    <label 
                      className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    >
                      آدرس وب‌سایت (اختیاری)
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="www.yourbrand.com"
                      className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all text-left dir-ltr placeholder:text-[#757575]"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    />
                  </div>

                  {/* Product Type */}
                  <div className="space-y-2 relative">
                    <label 
                      className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    >
                      نوع محصولات
                    </label>
                    <div className="relative">
                      <select
                        required
                        name="productType"
                        value={formData.productType}
                        onChange={handleChange}
                        className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all appearance-none cursor-pointer"
                        style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                      >
                        <option value="">انتخاب نوع محصولات...</option>
                        <option value="furniture">مبلمان و راحتی</option>
                        <option value="lighting">روشنایی و لوستر</option>
                        <option value="rug">فرش و کفپوش</option>
                        <option value="decor">اکسسوری و دکوراتیو</option>
                        <option value="other">سایر موارد</option>
                      </select>
                      <ChevronDown size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#292b2d]/30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label 
                      className="text-[11px] font-bold text-[#212121] uppercase tracking-[0.1em] block pr-2"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    >
                      توضیحات تکمیلی
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="درباره برند یا کاتالوگ محصولات خود توضیح دهید..."
                      rows={3}
                      className="w-full bg-white border border-[#E0E0E0] rounded-[12px] px-6 py-4 text-[16px] font-medium text-[#292b2d] focus:outline-none focus:border-[#292b2d] transition-all resize-none placeholder:text-[#757575]"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-6">
                  <div className="relative group">
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-[#292b2d] text-white h-[64px] rounded-[12px] text-[16px] font-medium tracking-[0.1em] hover:bg-black transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>شروع همکاری رایگان</span>
                          <ArrowLeft className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p 
                      className="text-[#292b2d]/60 text-[12px] font-medium"
                      style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                    >
                      بررسی درخواست شما در کمتر از ۲۴ ساعت انجام می‌شود.
                    </p>
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full text-right space-y-10"
            >
              <div className="w-16 h-16 bg-[#292b2d] flex items-center justify-center rounded-full">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-6">
                <h2 
                  className="text-[40px] md:text-[48px] font-light text-[#292b2d] leading-tight"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  درخواست شما <br /> با موفقیت ثبت شد.
                </h2>
                <p 
                  className="text-zinc-500 text-[18px] font-light leading-relaxed opacity-60 italic"
                  style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
                >
                  تیم کارشناسان هُما به‌زودی برای بررسی جزئیات همکاری با شما تماس خواهند گرفت.
                </p>
              </div>
              <button 
                onClick={() => navigate('/')}
                className="group flex items-center gap-4 text-[#292b2d] font-medium text-[14px] tracking-[0.2em] uppercase border-b border-[#292b2d]/20 pb-2 hover:border-[#292b2d] transition-all duration-700"
                style={{ fontFamily: 'var(--font-family-vazirmatn)' }}
              >
                <span>بازگشت به صفحه اصلی</span>
                <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-8px] transition-transform duration-700" />
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="w-full py-8 px-6 md:px-12 lg:px-24 bg-white border-t border-[#292b2d]/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <span className="text-[18px] font-black tracking-tighter text-[#292b2d]">HOMA.</span>
            <div className="hidden md:block w-[1px] h-4 bg-[#292b2d]/10" />
            <p className="text-[12px] text-[#292b2d]/70 font-bold" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              تمامی حقوق برای پلتفرم هُما محفوظ است. ۲۰۲۵
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <button className="text-[11px] font-bold text-[#292b2d]/60 uppercase tracking-[0.2em] hover:text-[#292b2d] transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>قوانین</button>
            <button className="text-[11px] font-bold text-[#292b2d]/60 uppercase tracking-[0.2em] hover:text-[#292b2d] transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>حریم خصوصی</button>
            <button className="text-[11px] font-bold text-[#292b2d]/60 uppercase tracking-[0.2em] hover:text-[#292b2d] transition-colors" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>پشتیبانی</button>
          </div>
        </div>
      </footer>
    </div>
  );
}