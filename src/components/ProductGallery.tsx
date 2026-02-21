import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { BuyButton } from "./BuyButton";
import type { Product } from "../types/product";
import { Header } from "./Header";
import { formatPriceFromRial } from "../utils/formatters";

interface ProductGalleryProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
}

export function ProductGallery({ products, onSelectProduct }: ProductGalleryProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category.toUpperCase())));
    return ["ALL", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === "ALL" || p.category.toUpperCase() === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-page flex flex-col font-vazirmatn" dir="rtl">
      {/* Editorial Navigation Overlay */}
      <Header transparent={false} />

      <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 md:px-12 py-16 md:py-24">
        
        {/* Zara Home Style Header */}
        <div className="flex flex-col mb-20 md:mb-32">
          <div className="flex items-baseline gap-4 mb-4">
             <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-accent">Collection</span>
             <div className="h-[1px] flex-1 bg-[var(--jet-black)] opacity-10" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="max-w-3xl">
              <h1 className="text-[48px] md:text-[84px] font-light leading-[0.9] tracking-tight text-[var(--jet-black)] mb-8">
                The <span className="font-bold">Gallery</span>
              </h1>
              <p className="text-[14px] md:text-[16px] text-[var(--muted-foreground)] max-w-lg leading-relaxed italic opacity-80">
                {t('explore.description')}
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col items-end gap-6">
               {/* Search Toggle */}
               <div className="flex items-center gap-4">
                  <AnimatePresence>
                    {isSearchOpen && (
                      <motion.input 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 200, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        type="text"
                        placeholder={t('common.search') + '...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-b border-[var(--jet-black)] text-[12px] pb-1 outline-none"
                      />
                    )}
                  </AnimatePresence>
                  <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="opacity-60 hover:opacity-100 transition-opacity">
                    {isSearchOpen ? <X size={18} /> : <Search size={18} />}
                  </button>
               </div>

               {/* Filters */}
               <nav className="flex flex-wrap gap-x-8 gap-y-3 justify-end">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] font-bold tracking-[0.3em] uppercase transition-all ${
                        selectedCategory === cat ? 'text-accent' : 'text-[var(--jet-black)] opacity-40 hover:opacity-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
               </nav>
            </div>
          </div>
        </div>

        {/* Catalog Grid - Asymmetrical editorial flow */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-24 md:gap-x-12">
          {filteredProducts.map((product, idx) => {
            // Zara Home Grids are often irregular. 
            // We use a pattern: Large, Small, Small, Large...
            const pattern = [8, 4, 4, 8, 4, 4, 6, 6];
            const colSpan = `md:col-span-${pattern[idx % pattern.length]}`;
            const isLarge = pattern[idx % pattern.length] >= 6;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                onClick={() => onSelectProduct(product.id)}
                className={`${colSpan} group cursor-pointer flex flex-col`}
              >
                {/* Image Wrapper */}
                <div className={`relative overflow-hidden mb-6 bg-[var(--accent-light)] ${isLarge ? 'aspect-[16/10]' : 'aspect-[3/4]'}`}>
                  <ImageWithFallback 
                    src={product.thumbnail} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-[2500ms] group-hover:scale-105"
                  />
                  
                  {/* Subtle Badge */}
                  <div className="absolute top-0 right-0 p-4">
                     <span className="text-[8px] font-bold tracking-[0.4em] uppercase bg-white/40 backdrop-blur-md px-2 py-1">
                        Select
                     </span>
                  </div>

                  {/* Buy Button - appears on hover */}
                  <div
                    className="absolute bottom-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BuyButton
                      productId={product.id}
                      sourceContext="gallery"
                      shopName={product.seller?.name || product.brand}
                      variant="ghost"
                      size="sm"
                      className="bg-white/80 backdrop-blur-sm hover:bg-white text-[10px] font-bold tracking-wider"
                    />
                  </div>

                  {/* Aesthetic Overlay */}
                  <div className="absolute inset-0 border border-black/5 pointer-events-none" />
                </div>

                {/* Details - Minimalist Zara Home Style */}
                <div className="space-y-2 px-1 text-center md:text-start">
                   <div className="flex items-center justify-center md:justify-start gap-3">
                      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-accent opacity-80">{product.category}</span>
                      <div className="w-4 h-[1px] bg-[var(--jet-black)] opacity-10" />
                   </div>
                   <h2 className="text-[20px] md:text-[24px] font-light text-[var(--jet-black)] leading-tight tracking-tight">
                      {product.name}
                   </h2>
                   <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                      <span className="text-[14px] font-medium text-[var(--muted-foreground)]">
                        {product.price ? formatPriceFromRial(product.price) : "Price upon request"}
                      </span>
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-40 group-hover:translate-x-1 transition-all" />
                   </div>
                </div>
              </motion.div>
            );
          })}

          {/* New Arrivals / Coming Soon Editorial Card */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-12 border border-[var(--border-subtle)] bg-white/20 min-h-[400px]">
             <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-accent mb-6">Upcoming</span>
             <h3 className="text-[24px] font-light text-center leading-relaxed">{t('common.comingSoon')}...</h3>
             <div className="w-12 h-[1px] bg-[var(--jet-black)] mt-8 opacity-20" />
          </div>
        </div>

        {/* Editorial Fine Print Footer */}
        <div className="mt-60 pt-24 border-t border-[var(--jet-black)] opacity-40">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-baseline">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-bold tracking-[0.4em] uppercase">About the Collection</h4>
                 <p className="text-[12px] leading-relaxed max-w-xs">
                    {t('explore.description')}
                 </p>
              </div>
              <div className="flex flex-col gap-2">
                 <h4 className="text-[10px] font-bold tracking-[0.4em] uppercase mb-2">Navigation</h4>
                 {['Archive', 'Materiality', 'Craftsmanship', 'Homa Studio'].map(link => (
                    <a key={link} href="#" className="text-[11px] tracking-widest uppercase hover:text-accent transition-colors w-fit">{link}</a>
                  ))}
              </div>
              <div className="text-start md:text-end space-y-4">
                 <h4 className="text-[10px] font-bold tracking-[0.4em] uppercase">Connect</h4>
                 <div className="flex md:justify-end gap-6 text-[12px]">
                    <a href="#" className="border-b border-transparent hover:border-accent">Instagram</a>
                    <a href="#" className="border-b border-transparent hover:border-accent">Journal</a>
                 </div>
              </div>
           </div>
           <div className="mt-24 text-center">
              <span className="text-[9px] font-medium tracking-[0.6em] uppercase">Homa Interior Intelligence — All rights reserved 2026</span>
           </div>
        </div>
      </main>
    </div>
  );
}
