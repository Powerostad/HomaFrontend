import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Sparkles, 
  Truck, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ScanLine,
  Share2,
  Star,
  Store,
  Search,
  ArrowRight,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_STORES } from '../../data/mock';
import { useApp } from '../../context/AppContext';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Button } from '../../components/ui/button';
import { trackEvent } from '../../utils/analytics';
import { Header } from '../../components/Header';
import { HomaLoader } from "../../components/HomaLoader";
import { ContextBar } from '../../components/ContextBar';

const exampleImage = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800";

const PRODUCT_SIZES = [
  { id: 's1', name: 'تک‌نفره', dimensions: '۱۵۰ در ۲۲۰ سانتی‌متر', price: 3490000 },
  { id: 's2', name: 'دونفره', dimensions: '۲۰۰ در ۲۲۰ سانتی‌متر', price: 3990000 },
  { id: 's3', name: 'کینگ', dimensions: '۲۴۰ در ۲۲۰ سانتی‌متر', price: 3990000 },
  { id: 's4', name: 'سوپرکینگ', dimensions: '۲۶۰ در ۲۴۰ سانتی‌متر', price: 5290000 },
];

const COLORS = [
  { id: 'c1', name: 'چیتا', hex: '#d2b48c', code: '۹۱۶۱/۰۸۸/۱۰۶' },
  { id: 'c2', name: 'پلنگی', hex: '#4b3621', code: '۹۱۶۱/۰۸۸/۲۰۰' },
];

export function ProductDetailsPage() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const { setProduct } = useApp() as any;
  const [product, setProductData] = useState<any>(null);
  const [store, setStoreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(PRODUCT_SIZES[0].id);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].id);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      console.log('ProductDetailsPage: fetching for slug:', slug, 'productId:', productId);
      const foundStore = MOCK_STORES.find(s => s.slug.toLowerCase() === slug?.toLowerCase());
      if (foundStore) {
        setStoreData(foundStore);
        const foundProduct = foundStore.products.find(p => p.id === productId);
        
        if (foundProduct) {
             if (foundProduct.id === 'p1' && foundStore.slug === 'classic-furniture') {
                 setProductData({ ...foundProduct, thumbnail: exampleImage });
             } else {
                 setProductData(foundProduct);
             }
        }
      } else {
        console.error('ProductDetailsPage: store not found for slug:', slug);
      }
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [slug, productId]);

  const handleTestDecor = () => {
    if (product) {
      trackEvent('click_test_decor_single_cta', { productId: product.id });
      setProduct(product);
      navigate('/try-on/upload');
    }
  };

  if (isLoading) {
    return <HomaLoader />;
  }

  if (!product) return <div className="p-8 text-center text-muted-foreground">محصول یافت نشد</div>;

  const currentPrice = PRODUCT_SIZES.find(s => s.id === selectedSize)?.price || product.price;

  return (
    <div className="min-h-screen bg-[#FDFDFB] selection:bg-black/5 flex flex-col" dir="rtl">
      <Header />
      <ContextBar 
        items={[
          { label: 'خانه', href: '/' },
          { label: 'فروشگاه‌ها', href: '/explore' },
          { label: store?.name || 'فروشگاه', href: `/store/${slug}` },
          { label: product.name }
        ]}
      />

      <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-0 md:px-16 pt-0 md:pt-10 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-16">
          
          {/* IMAGE SECTION - Vertical Gallery + Main */}
          <div className="md:col-span-8 flex flex-row-reverse gap-4">
            {/* Main Image */}
            <div className="flex-1 relative aspect-square overflow-hidden bg-black/[0.01]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  <ImageWithFallback 
                    src={product.thumbnail} 
                    alt={product.name} 
                    className="w-full h-full object-cover aspect-square"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Vertical Thumbnails */}
            <div className="hidden md:flex flex-col gap-2 shrink-0">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`w-20 h-20 overflow-hidden border transition-all duration-300 ${
                    activeImageIdx === i ? 'border-black' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback src={product.thumbnail} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* EDITORIAL INFO PANEL */}
          <div className="md:col-span-4 px-6 md:px-0 mt-8 md:mt-0">
            <div className="flex flex-col gap-6 md:sticky md:top-32">
              
              {/* Product Heading */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] text-black/40 font-bold uppercase tracking-widest">
                  <span>اتاق خواب</span>
                  <ChevronLeft size={10} />
                  <span>کالای خواب</span>
                  <ChevronLeft size={10} />
                  <span>کاور لحاف</span>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-[22px] md:text-[24px] font-bold text-black leading-tight tracking-wide">
                    {product.name}
                  </h1>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[16px] md:text-[18px] font-bold text-black">
                      {PRODUCT_SIZES[0].price.toLocaleString()} تومان - {PRODUCT_SIZES[PRODUCT_SIZES.length-1].price.toLocaleString()} تومان
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-black/40 font-bold uppercase tracking-widest mb-2">
                    رنگ: {COLORS.find(c => c.id === selectedColor)?.name} | کد {COLORS.find(c => c.id === selectedColor)?.code}
                  </p>
                  <div className="flex gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        className={`w-6 h-6 rounded-full border p-0.5 transition-all ${
                          selectedColor === color.id ? 'border-black' : 'border-transparent'
                        }`}
                      >
                        <div 
                          className="w-full h-full rounded-full" 
                          style={{ backgroundColor: color.hex }} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="py-6 border-t border-black/[0.05] space-y-4">
                <p className="text-[13px] text-black/60 leading-relaxed font-medium">
                  کاور لحاف با تراکم ۳۰۰ رشته‌ای، بافته شده از ساتن مرغوب با طرح حیوانات.
                </p>
                <p className="text-[13px] text-black/60 leading-relaxed font-medium">
                  دارای دکمه‌های پنهان در قسمت پایین برای بستن آسان.
                </p>
              </div>

              {/* Size Selection */}
              <div className="space-y-4 pt-4 border-t border-black/[0.05]">
                <span className="text-[11px] font-bold text-black/40 uppercase tracking-widest">انتخاب سایز</span>
                <div className="flex flex-col border-b border-black/[0.05]">
                  {PRODUCT_SIZES.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`flex items-center justify-between py-4 group transition-all ${
                        selectedSize === size.id ? 'bg-black/5 px-2' : 'hover:bg-black/[0.02] px-0'
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-bold text-black">{size.name}</span>
                        <span className="text-[12px] text-black/30 font-medium">({size.dimensions})</span>
                      </div>
                      <span className="text-[14px] font-bold text-black">
                        {size.price.toLocaleString()} تومان
                      </span>
                    </button>
                  ))}
                </div>
                <button className="text-[11px] font-bold text-black/40 underline underline-offset-4 uppercase tracking-widest">
                  راهنمای سایز
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-8 space-y-3">
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleTestDecor}
                    className="w-full h-14 rounded-none bg-black text-white hover:bg-black/90 text-[14px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl"
                  >
                    <Sparkles size={20} />
                    امتحانش کن در فضای خودت (AI Try-On)
                  </Button>
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline"
                      className="flex-1 h-12 rounded-none border-black/10 text-black hover:bg-black/5 text-[13px] font-bold tracking-widest"
                    >
                      افزودن به سبد
                    </Button>
                    <button className="flex-1 h-12 flex items-center justify-center border border-black/10 hover:bg-black/5 transition-all text-black/60 font-bold text-[12px] gap-2">
                      <Heart size={18} strokeWidth={1} />
                      ذخیره برای بعد
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-black/[0.05]">
                  <button className="text-[11px] font-bold text-black/60 uppercase tracking-widest text-start hover:text-black">جزئیات محصول</button>
                  <button className="text-[11px] font-bold text-black/60 uppercase tracking-widest text-start hover:text-black">ارسال و بازگشت</button>
                  <button className="text-[11px] font-bold text-black/60 uppercase tracking-widest text-start hover:text-black">موجودی در فروشگاه‌ها</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* STICKY MOBILE CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-black/[0.02] z-[120] md:hidden">
        <Button 
          onClick={handleTestDecor}
          className="w-full h-12 rounded-none bg-black text-white text-[13px] font-bold active:scale-[0.98]"
        >
          امتحانش کن در فضای خودت
        </Button>
      </div>

    </div>
  );
}