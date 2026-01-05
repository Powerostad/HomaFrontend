import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Share2,
  Download,
  ShoppingBag,
  Heart,
  X,
  Menu,
  Maximize2,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { Header } from '../../components/Header';
import { SidebarMenu } from '../../components/SidebarMenu';
import { toast } from "sonner";
const resultImage = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

// Mock data retrieval for a specific result
const getMockResult = (id: string) => {
  return {
    id,
    product: {
      id: 'p1',
      name: 'مبل مدرن کالکشن پاییز',
      price: 3450000,
      image: resultImage,
      seller: { name: 'HOMA COLLECTION' },
      dimensions: '210 x 95 x 85 cm',
      material: 'چوب بلوط و کتان',
      maintenance: 'نظافت تخصصی',
      origin: 'کالکشن هُما ۲۰۲۴'
    },
    afterImage: resultImage,
    beforeImage: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1200',
    timestamp: '۲ روز پیش'
  };
};

export default function GalleryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useApp() as any;
  const [result, setResult] = useState<any>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (id) {
      setResult(getMockResult(id));
    }
  }, [id]);

  if (!result) return null;

  const product = result.product;

  const handleShare = () => {
    toast.success('لینک طرح برای اشتراک‌گذاری کپی شد');
  };

  const handleDownload = () => {
    toast.success('در حال آماده‌سازی فایل دانلود...');
  };

  const handleDelete = () => {
    toast.error('آیا از حذف این طرح اطمینان دارید؟', {
      action: {
        label: 'حذف',
        onClick: () => {
          toast.success('طرح با موفقیت از گالری حذف شد');
          navigate('/account/gallery');
        }
      }
    });
  };

  const ProductContent = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className={`flex flex-col gap-8 ${isDesktop ? 'px-10' : 'px-8'} pb-[96px]`}>
      {/* Gallery Context Label */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1 bg-secondary rounded-full">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">از گالری من</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">{result.timestamp}</span>
      </div>

      {/* Used Product Section */}
      <div className="flex flex-col gap-4 pb-6 border-b border-border">
        <div className="flex justify-between items-center">
          <h4 className="text-[16px] font-bold text-foreground">محصول استفاده‌شده</h4>
          <span className="px-2 py-0.5 bg-[#dfff00]/20 text-foreground text-[10px] font-bold rounded-sm">استفاده‌شده در Try-On</span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative w-[84px] h-[84px] rounded-[14px] overflow-hidden flex-shrink-0 border border-border bg-secondary/30">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <h1 className="text-[18px] font-bold text-foreground leading-tight">{product.name}</h1>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-bold text-foreground">
                {toPersianDigits(product.price.toLocaleString())}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">تومان</span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-[0.1em] mt-0.5">
              {product.seller.name}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3 border-b border-border pb-6">
        <button onClick={handleShare} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-secondary transition-colors group">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Share2 size={18} />
          </div>
          <span className="text-[11px] font-bold">اشتراک</span>
        </button>
        <button onClick={handleDownload} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-secondary transition-colors group">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
            <Download size={18} />
          </div>
          <span className="text-[11px] font-bold">دانلود</span>
        </button>
        <button onClick={handleDelete} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-destructive/5 transition-colors group">
          <div className="w-10 h-10 rounded-full bg-destructive/5 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
            <Trash2 size={18} />
          </div>
          <span className="text-[11px] font-bold text-destructive">حذف</span>
        </button>
      </div>

      {/* Specs */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[1.5px] mb-1">مشخصات فنی</h3>
        <div className="flex flex-col">
          {[
            { label: 'ابعاد کلی', value: product.dimensions },
            { label: 'جنس و متریال', value: product.material },
            { label: 'نگهداری', value: product.maintenance },
            { label: 'مبدا طراحی', value: product.origin }
          ].map((spec, i) => (
            <div key={i} className="flex justify-between items-center h-[36px] border-b border-border last:border-0">
              <span className="text-[12px] text-muted-foreground">{spec.label}</span>
              <span className="text-[12px] font-bold text-foreground">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center opacity-10 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-foreground">SAVED IN YOUR HOMA GALLERY</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-background relative overflow-hidden flex flex-col font-vazirmatn select-none" dir="rtl">
      {!isFullScreen && (
        <div className="md:hidden">
          <Header />
        </div>
      )}

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Info */}
        <div className="hidden md:flex flex-col w-[450px] h-full bg-card z-50 overflow-y-auto border-l border-border relative scrollbar-hide">
          <div className="p-8 pt-10 flex flex-col gap-10">
            <div className="flex items-center justify-between">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 text-foreground/60 hover:text-foreground">
                <Menu size={24} strokeWidth={1.5} />
              </button>
              <Link to="/account/gallery" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowRight size={18} className="rotate-0 group-hover:translate-x-1 transition-transform" />
                <span className="text-[14px] font-bold">بازگشت به گالری</span>
              </Link>
              <div className="w-10" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{product.seller.name}</span>
              <h1 className="text-[28px] font-bold text-foreground leading-tight">{product.name}</h1>
            </div>
          </div>

          <ProductContent isDesktop />
        </div>

        {/* Right Side: Hero */}
        <div className="flex-1 h-full bg-secondary relative overflow-hidden group">
          <ImageWithFallback
            src={result.afterImage}
            alt="Result"
            className={`w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
          />
          <img
            src={result.beforeImage}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${showOriginal ? 'opacity-100' : 'opacity-0'}`}
            alt="Before"
          />

          {/* Desktop Controls */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 pointer-events-auto">
              <button onClick={() => navigate('/account/gallery')} className="w-12 h-12 rounded-full bg-black/10 backdrop-blur-xl border border-white/20 text-white hover:bg-black/20 flex items-center justify-center transition-all shadow-lg">
                <ArrowRight size={24} />
              </button>
            </div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
              <button onClick={() => setIsFullScreen(true)} className="flex items-center gap-3 px-8 h-[56px] bg-black/40 backdrop-blur-2xl rounded-full border border-white/20 text-white shadow-2xl active:scale-95 group/btn">
                <Maximize2 size={18} />
                <span className="text-[13px] font-bold tracking-wide">نمای بزرگ</span>
              </button>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-[210]">
            <button onClick={() => navigate('/account/gallery')} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10">
              <ArrowRight size={20} />
            </button>
            <button onClick={() => setIsFullScreen(true)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/10">
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Info Overlay */}
        <div className="md:hidden absolute inset-x-0 bottom-0 max-h-[40vh] bg-card rounded-t-[32px] pt-8 shadow-2xl z-30 overflow-y-auto scrollbar-hide">
          <ProductContent />
        </div>
      </div>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 md:p-12">
            <button onClick={() => setIsFullScreen(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center">
              <X size={24} />
            </button>
            <div className="relative max-w-full max-h-[80vh] aspect-[4/5] rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
              <ImageWithFallback src={result.afterImage} className={`w-full h-full object-contain transition-opacity ${showOriginal ? 'opacity-0' : 'opacity-100'}`} />
              <img src={result.beforeImage} className={`absolute inset-0 w-full h-full object-contain transition-opacity ${showOriginal ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            <div className="mt-10 flex items-center p-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
              <button onClick={() => setShowOriginal(false)} className={`px-10 h-12 rounded-full text-[14px] font-bold ${!showOriginal ? 'bg-white text-black' : 'text-white/60'}`}>بُعد</button>
              <button onClick={() => setShowOriginal(true)} className={`px-10 h-12 rounded-full text-[14px] font-bold ${showOriginal ? 'bg-white text-black' : 'text-white/60'}`}>قبل</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
