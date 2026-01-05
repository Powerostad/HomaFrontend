import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  Sparkles, 
  Image as ImageIcon, 
  Info, 
  Check, 
  X, 
  AlertCircle,
  Menu,
  User,
  Search,
  Maximize2,
  Zap,
  ScanLine
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { Header } from '../../components/Header';
import { ContextBar } from '../../components/ContextBar';
import { DecisionPointOverlay } from '../../components/DecisionPointOverlay';
import { AuthModal } from '../../components/AuthModal';

export function TryOnUploadPage() {
  const navigate = useNavigate();
  const { setSelectedFile, trackKPI, product, isLoggedIn, setUser } = useApp() as any;
  const [preview, setPreview] = useState<string | null>(null);
  const [showDecision, setShowDecision] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const GUIDELINES = [
    { id: 'frame', label: 'کل فضا داخل کادر', icon: <Maximize2 size={12} strokeWidth={1.5} /> },
    { id: 'light', label: 'نور کافی و طبیعی', icon: <Zap size={12} strokeWidth={1.5} /> },
    { id: 'sharp', label: 'عکس صاف و شفاف', icon: <ScanLine size={12} strokeWidth={1.5} /> },
  ];

  const EXAMPLES = {
    good: {
      label: 'نمونه مطلوب',
      image: 'https://images.unsplash.com/photo-1581209410127-8211e90da024?q=80&w=800',
      caption: 'نور کافی، قاب کامل، زاویه صاف'
    },
    bad: {
      label: 'نمونه نامناسب',
      reason: 'نور کم و کادر ناقص',
      image: 'https://images.unsplash.com/photo-1715366843673-f21a95ec11cc?q=80&w=800',
      caption: 'تار، کج، نیمه‌کادر یا شلوغ'
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (trackKPI) trackKPI('upload_started', { fileName: file.name, fileSize: file.size });
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setShowDecision(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceed = () => {
    if (trackKPI) trackKPI('upload_confirmed');
    navigate('/try-on/progress');
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setShowAuth(false);
    navigate('/try-on/progress');
  };

  return (
    <div className="h-screen bg-[#FDFDFB] flex flex-col overflow-hidden relative" dir="rtl">
      
      {/* 1. HEADER & BREADCRUMBS */}
      <div className="relative z-[110] shrink-0 bg-[#FDFDFB] border-b border-black/[0.03]">
        <Header />
        <ContextBar 
          items={[
            { label: 'خانه', href: '/' },
            { label: 'امتحان در فضای تو', href: '/try-on' },
            { label: 'آپلود عکس فضا' }
          ]}
        />
      </div>

      <main className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto relative z-10 overflow-y-auto pb-32 scrollbar-hide bg-[#FDFDFB]">
        
        {/* 2. HERO AREA - Editorial Title with Spacing */}
        <div className="px-6 md:px-16 pt-6 pb-2">
          <div className="space-y-2">
            <h1 className="text-h2 md:text-h1 font-medium text-foreground tracking-tight" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>
              آپلود تصویر فضا
            </h1>
            {product && (
              <p className="text-p text-muted-foreground">
                برای امتحان <span className="text-foreground font-bold">{product.name}</span> تصویری از فضای خود انتخاب کنید.
              </p>
            )}
            <div className="h-px w-full bg-foreground/[0.05]" />
          </div>
        </div>

        {/* 3. TEACHING SECTION - Editorial Layout (Restored Aspect Ratio) */}
        <div className="px-6 md:px-16 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 pt-4">
            {/* GOOD EXAMPLE */}
            <div className="space-y-3">
              <div className="relative aspect-[3/2] bg-white overflow-hidden border border-black/[0.03]">
                <ImageWithFallback src={EXAMPLES.good.image} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-[#E1FF00] px-2 py-1 flex items-center z-20">
                  <span className="text-[10px] font-bold text-black" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>مطلوب</span>
                </div>
              </div>
              <p className="text-[13px] text-black/80 font-medium leading-tight">مطلوب: {EXAMPLES.good.caption}</p>
            </div>

            {/* BAD EXAMPLE */}
            <div className="space-y-3">
              <div className="relative aspect-[3/2] bg-white overflow-hidden border border-black/[0.03]">
                <ImageWithFallback src={EXAMPLES.bad.image} className="w-full h-full object-cover grayscale-[0.3]" />
                <div className="absolute top-3 right-3 bg-[#FF4F11] px-2 py-1 flex items-center z-20">
                  <span className="text-[10px] font-bold text-white" style={{ fontFamily: 'var(--font-family-vazirmatn)' }}>نامناسب</span>
                </div>
              </div>
              <p className="text-[13px] text-black/80 font-medium leading-tight">نامناسب: {EXAMPLES.bad.caption}</p>
            </div>
          </div>
        </div>

        {/* 4. PRESETS SECTION removed - Hairline Divider also removed to tighten space */}

      </main>

      {/* 5. STICKY BOTTOM ACTION BAR - Zara Home Hierarchy */}
      <div className="fixed bottom-0 left-0 right-0 py-6 px-6 md:px-16 bg-[#FDFDFB]/95 backdrop-blur-md border-t border-black/[0.03] z-[120]">
        <div className="max-w-[1440px] mx-auto flex flex-col items-center gap-4">
          
          <div className="w-full max-w-[420px] flex flex-col items-center gap-4">
            {/* Primary Actions: Side by Side Grid */}
            <div className="w-full grid grid-cols-2 gap-3">
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 bg-black text-white text-[12px] font-medium uppercase tracking-[0.1em] hover:bg-black/90 transition-all active:scale-[0.98] flex items-center justify-center"
              >
                  <span>گرفتن عکس</span>
              </button>

              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 bg-white border border-black/10 text-black text-[12px] font-medium uppercase tracking-[0.1em] hover:bg-black/[0.02] transition-all active:scale-[0.98] flex items-center justify-center"
              >
                  <span>گالری</span>
              </button>
            </div>

            {/* Tertiary: Minimal Text Link removed as requested */}
          </div>
        </div>
      </div>

      {/* DECISION POINT OVERLAY */}
      <DecisionPointOverlay 
        isOpen={showDecision}
        onClose={() => setShowDecision(false)}
        title="تصویر شما آماده است"
        description="لطفاً تایید کنید که تصویر انتخابی شفاف و دارای نور کافی است."
        image={preview || undefined}
        primaryCTA={{
          label: "تایید",
          onClick: handleProceed,
          icon: <Sparkles size={18} />
        }}
        secondaryCTA={{
          label: "انتخاب مجدد",
          onClick: () => {
            setShowDecision(false);
            fileInputRef.current?.click();
          },
          icon: <Camera size={18} />
        }}
        exitAction={{
          label: "انصراف",
          onClick: () => {
            setShowDecision(false);
            setPreview(null);
          }
        }}
        type="accent"
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* AUTH MODAL */}
      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}