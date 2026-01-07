import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Settings,
  Share2,
  Download,
  ShoppingBag,
  Sparkles,
  Layout,
  MessageSquare
} from 'lucide-react';
import { Header } from '../../components/Header';
import { StudioSessions } from '../../components/studio/StudioSessions';
import { useStudio } from '../../context/StudioContext';
import { StudioProject, StudioSession, StudioRecommendation } from '../../types/studio';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

// --- MOCK DATA FOR DEMO ---
const MOCK_PROJECT: StudioProject = {
  id: 'p1',
  name: 'آپارتمان جردن - پذیرایی',
  createdAt: new Date().toISOString(),
  thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop',
  shoppingList: [],
  sessions: [
    {
      id: 's2',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      summary: 'نسخه گرم‌تر و صمیمی',
      brief: {
        style: 'Modern Minimal with Wood Accents',
        budget: 'متوسط',
        constraints: ['نور کم', 'ابعاد کوچک']
      },
      recommendations: [
        { id: 'r1', name: 'آباژور پایه چوبی', price: 2450000, category: 'نور', image: 'https://images.unsplash.com/photo-1756474215831-4e5f8309c6bc?q=80&w=300&auto=format&fit=crop', store: 'Lumino Shop', status: 'none' },
        { id: 'r2', name: 'فرش دستباف لاکی', price: 15800000, category: 'کف', image: 'https://images.unsplash.com/photo-1594125675036-153d1b064762?q=80&w=300&auto=format&fit=crop', store: 'Farsh Market', status: 'none' },
        { id: 'r3', name: 'تابلو انتزاعی کویر', price: 1200000, category: 'دیوار', image: 'https://images.unsplash.com/photo-1759714881681-ef0612ce6a86?q=80&w=300&auto=format&fit=crop', store: 'Art Gallery', status: 'none' },
        { id: 'r4', name: 'کوسن مخمل خردلی', price: 450000, category: 'اکسسوری', image: 'https://images.unsplash.com/photo-1759722665629-29df6ee4f9a5?q=80&w=300&auto=format&fit=crop', store: 'Home Decor', status: 'none' },
      ]
    },
    {
      id: 's1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      summary: 'پیشنهاد اولیه (مینیمال)',
      brief: {
        style: 'Nordic Minimal',
        budget: 'اقتصادی',
        constraints: ['نور کم']
      },
      recommendations: [
        { id: 'r5', name: 'لامپ ایستاده فلزی', price: 1800000, category: 'نور', image: 'https://images.unsplash.com/photo-1756474215831-4e5f8309c6bc?q=80&w=300&auto=format&fit=crop', store: 'Modern Light', status: 'none' },
        { id: 'r6', name: 'فرش طوسی خنثی', price: 8500000, category: 'کف', image: 'https://images.unsplash.com/photo-1594125675036-153d1b064762?q=80&w=300&auto=format&fit=crop', store: 'Rug Studio', status: 'none' },
      ]
    }
  ]
};

export function StudioProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { studioProjects, updateStudioProject } = useStudio();

  const [activeTab, setActiveTab] = useState<'design' | 'recommendations' | 'shopping'>('recommendations');

  // Find project in state or use mock if testing
  const project = studioProjects.find((p: StudioProject) => p.id === projectId) || MOCK_PROJECT;

  const handleAddToShoppingList = (productId: string) => {
    const isAlreadyAdded = project.shoppingList.includes(productId);
    if (isAlreadyAdded) return;

    const newShoppingList = [...project.shoppingList, productId];
    updateStudioProject(project.id, { shoppingList: newShoppingList });
    toast.success('محصول به لیست خرید پروژه اضافه شد');
  };

  const handleAddAllToShoppingList = (sessionId: string) => {
    const session = project.sessions.find((s: StudioSession) => s.id === sessionId);
    if (!session) return;

    const sessionProductIds = session.recommendations.map((r: StudioRecommendation) => r.id);
    const newShoppingList = Array.from(new Set([...project.shoppingList, ...sessionProductIds]));

    updateStudioProject(project.id, { shoppingList: newShoppingList });
    toast.success('تمامی محصولات سشن به لیست خرید اضافه شدند');
  };

  return (
    <div className="min-h-screen bg-background font-vazirmatn flex flex-col" dir="rtl">
      <Header />

      {/* Project Banner/Header */}
      <div className="relative h-[240px] w-full overflow-hidden">
        <img
          src={project.thumbnail}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col sm:flex-row justify-between items-end gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/studio/projects')}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <ArrowRight size={24} />
            </button>
            <div className="flex flex-col">
              <span className="text-[12px] text-white/60 font-medium mb-1 uppercase tracking-widest">پروژه استودیو هُما</span>
              <h1 className="text-[28px] font-bold text-white leading-none">{project.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <Share2 size={18} />
            </button>
            <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <Settings size={18} />
            </button>
            <Button className="h-11 px-6 rounded-full bg-accent text-accent-foreground font-bold flex items-center gap-2 shadow-lg">
              <Sparkles size={18} />
              <span>ساخت پیشنهاد جدید</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-zinc-900 border-b border-border sticky top-[64px] z-20">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('design')}
            className={`py-5 text-[14px] font-bold transition-all relative whitespace-nowrap ${activeTab === 'design' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2">
              <Layout size={18} />
              <span>طراحی ویژوال</span>
            </div>
            {activeTab === 'design' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full" />}
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-5 text-[14px] font-bold transition-all relative whitespace-nowrap ${activeTab === 'recommendations' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={18} />
              <span>پیشنهادهای هوشمند</span>
              <span className="ml-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center">
                {project.sessions.length}
              </span>
            </div>
            {activeTab === 'recommendations' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full" />}
          </button>

          <button
            onClick={() => setActiveTab('shopping')}
            className={`py-5 text-[14px] font-bold transition-all relative whitespace-nowrap ${activeTab === 'shopping' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>لیست خرید پروژه</span>
              <span className="ml-1 w-5 h-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center">
                {project.shoppingList.length}
              </span>
            </div>
            {activeTab === 'shopping' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full" />}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <StudioSessions
                project={project}
                onAddToShoppingList={handleAddToShoppingList}
                onAddAllToShoppingList={handleAddAllToShoppingList}
                onLikeProduct={(_id) => toast.info('محصول به علاقه‌مندی‌ها اضافه شد')}
                onCreateNewSession={() => navigate('/studio/upload')}
              />
            </motion.div>
          )}

          {activeTab === 'design' && (
            <motion.div
              key="design-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-6 py-20 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Layout size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-[20px] font-bold text-foreground mb-2">طراحی ویژوال هنوز نهایی نشده</h3>
              <p className="text-[14px] text-muted-foreground max-w-[320px] mb-8">
                شما می‌توانید آخرین ران‌های طراحی خود را در اینجا مشاهده و مقایسه کنید.
              </p>
              <Button onClick={() => navigate('/studio/upload')} className="btn-primary px-10 h-14 rounded-full">
                ورود به ادیتور ویژوال
              </Button>
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[20px] font-bold">لیست نهایی خرید</h2>
                <Button variant="ghost" className="text-accent flex items-center gap-2">
                  <Download size={18} />
                  <span>دانلود لیست (PDF)</span>
                </Button>
              </div>

              {project.shoppingList.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                    <ShoppingBag size={32} className="text-muted-foreground" />
                  </div>
                  <p className="text-[14px] text-muted-foreground">هنوز محصولی به لیست خرید اضافه نشده است.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Real implementation would map products by IDs */}
                  <div className="p-6 bg-white dark:bg-zinc-900 rounded-[32px] border border-border flex flex-col items-center justify-center text-center py-20">
                    <p className="text-[14px] text-muted-foreground">آیتم‌های انتخاب شده در اینجا نمایش داده می‌شوند.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button for Help/Expert */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-foreground text-background shadow-2xl flex items-center justify-center z-[100]"
      >
        <MessageSquare size={24} />
      </motion.button>
    </div>
  );
}
