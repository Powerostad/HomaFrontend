import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { SidebarMenu } from '../../components/SidebarMenu';
import { ResultCard } from '../../components/account/ResultCard';
import { EmptyGallery } from '../../components/account/EmptyGallery';
import { toast } from 'sonner';
const resultImage = "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200";

const MOCK_GALLERY = [
  {
    id: 'res-1',
    coverImage: resultImage,
    productName: 'مبل مدرن کالکشن پاییز',
    storeName: 'HOMA COLLECTION',
    timestamp: '۲ روز پیش',
    isPinned: true
  },
  {
    id: 'res-2',
    coverImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800',
    productName: 'صندلی ناهارخوری لونا',
    storeName: 'ایکیا ایران',
    timestamp: '۱ هفته پیش',
    isPinned: false
  },
  {
    id: 'res-3',
    coverImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800',
    productName: 'میز جلو‌مبلی بیستون',
    storeName: 'چوبار',
    timestamp: '۱۰ دی ۱۴۰۴',
    isPinned: false
  }
];

export default function GalleryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'pinned'>('all');
  const [results, setResults] = useState(MOCK_GALLERY);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredResults = activeTab === 'all'
    ? results
    : results.filter(r => r.isPinned);

  const handleDelete = (id: string) => {
    setResults(results.filter(r => r.id !== id));
    toast.success('طرح با موفقیت حذف شد');
  };

  const handleShare = (id: string) => {
    toast.success('لینک طرح کپی شد');
  };

  const handleTogglePin = (id: string) => {
    setResults(results.map(r =>
      r.id === id ? { ...r, isPinned: !r.isPinned } : r
    ));
    const isNowPinned = !results.find(r => r.id === id)?.isPinned;
    toast.success(isNowPinned ? 'به پین‌شده‌ها اضافه شد' : 'از پین‌شده‌ها حذف شد');
  };

  const handleCardClick = (id: string) => {
    navigate(`/account/gallery/${id}`);
  };

  return (
    <div className="min-h-screen bg-background font-vazirmatn flex flex-col" dir="rtl">
      <Header />
      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 md:px-16 py-12 md:py-20 flex flex-col gap-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-[34px] font-bold text-foreground">گالری من</h1>
            <p className="text-[15px] text-muted-foreground">تمامی نتایج Try-On شما در یک نگاه</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center p-1.5 bg-secondary/50 backdrop-blur-md rounded-full border border-border">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-8 h-10 rounded-full text-[13px] font-bold transition-all ${activeTab === 'all' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              همه
            </button>
            <button
              onClick={() => setActiveTab('pinned')}
              className={`px-8 h-10 rounded-full text-[13px] font-bold transition-all ${activeTab === 'pinned' ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              پین‌شده
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1">
          {filteredResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {filteredResults.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onTogglePin={handleTogglePin}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          ) : (
            <EmptyGallery />
          )}
        </div>
      </main>
    </div>
  );
}