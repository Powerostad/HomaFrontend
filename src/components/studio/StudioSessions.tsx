import { useSiteTranslation } from '@/i18n/siteCopy';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  History,
  MoreHorizontal,
  Pin,
  Plus,
  Sparkles
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { StudioProject } from '../../types/studio';
import { formatPriceFromRial } from '../../utils/formatters';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';

interface StudioSessionsProps {
  project: StudioProject;
  onAddToShoppingList: (productId: string) => void;
  onLikeProduct: (productId: string, isLiked: boolean) => void;
  onAddAllToShoppingList: (sessionId: string) => void;
  onCreateNewSession: (sessionId: string) => void;
}

export function StudioSessions({ 
  project, 
  onAddToShoppingList, 
  onLikeProduct,
  onAddAllToShoppingList,
  onCreateNewSession
}: StudioSessionsProps) {
  const { siteText, siteValue, siteLocale } = useSiteTranslation();
  const [expandedSessions, setExpandedSessions] = useState<string[]>(
    project.sessions.length > 0 ? [project.sessions[0].id] : []
  );

  const toggleSession = (id: string) => {
    setExpandedSessions(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const categories = [siteText("کف"), siteText("نور"), siteText("دیوار"), siteText("اکسسوری")];

  if (project.sessions.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
          <History size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-[20px] font-bold text-foreground mb-2">{siteText("هنوز پیشنهادی ساخته نشده")}</h3>
        <p className="text-[14px] text-muted-foreground max-w-[280px] mb-8">
          {siteText("برای دریافت اولین پیشنهادهای هوشمند استودیو هُما، کافیست بریریف پروژه را تکمیل کنید.")}</p>
        <Button className="btn-primary px-10 h-14 rounded-[var(--radius-card)]">
          {siteText("ساخت اولین پیشنهاد")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between px-6 mb-2">
        <h2 className="text-[18px] font-bold text-foreground">{siteText("پیشنهادهای استودیو")}</h2>
        <span className="text-[12px] text-muted-foreground">{siteValue(project.sessions.length)} {siteText("سشن")}</span>
      </div>

      <div className="space-y-4 px-6">
        {siteValue(project.sessions.map((session, sIdx) => {
          const isExpanded = expandedSessions.includes(session.id);
          const date = new Date(session.createdAt);
          const timeStr = date.toLocaleTimeString(siteLocale(), { hour: '2-digit', minute: '2-digit' });
          const dateStr = date.toLocaleDateString(siteLocale(), { month: 'long', day: 'numeric' });

          return (
            <div 
              key={session.id} 
              className={`bg-white dark:bg-zinc-900 rounded-[24px] border border-border overflow-hidden transition-all ${isExpanded ? 'shadow-lg' : 'hover:border-black/10'}`}
            >
              {/* Session Header */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSession(session.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sIdx === 0 ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    <Sparkles size={20} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-foreground">Session {siteValue(project.sessions.length - sIdx)}</span>
                      {siteValue(session.isPinned && <Pin size={12} className="text-accent fill-accent" />)}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{siteValue(dateStr)} {siteText("• ساعت")}{siteValue(timeStr)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end mr-4">
                    <span className="text-[13px] font-bold text-foreground">{siteValue(session.summary)}</span>
                    <span className="text-[10px] text-muted-foreground">{siteValue(session.recommendations.length)} {siteText("محصول")}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground">
                    {siteValue(isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                  </div>
                </div>
              </div>

              {/* Session Body */}
              <AnimatePresence>
                {siteValue(isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-6 space-y-8">
                      {/* Action Bar */}
                      <div className="flex flex-wrap gap-3 pb-2 border-b border-border mb-4">
                        <Button 
                          onClick={() => onAddAllToShoppingList(session.id)}
                          className="h-10 px-6 rounded-full bg-foreground text-background text-[12px] font-bold flex items-center gap-2"
                        >
                          <Plus size={16} />
                          <span>{siteText("افزودن همه به لیست خرید")}</span>
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => onCreateNewSession(session.id)}
                          className="h-10 px-6 rounded-full bg-secondary/50 text-foreground text-[12px] font-bold flex items-center gap-2"
                        >
                          <History size={16} />
                          <span>{siteText("نسخه جدید از این سشن")}</span>
                        </Button>
                      </div>

                      {/* Brief Snapshot (Optional/Small) */}
                      <div className="bg-secondary/20 p-4 rounded-2xl flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{siteText("سبک انتخابی")}</span>
                          <span className="text-[12px] font-bold text-foreground">{siteValue(session.brief.style)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{siteText("بودجه")}</span>
                          <span className="text-[12px] font-bold text-foreground">{siteValue(session.brief.budget)}</span>
                        </div>
                      </div>

                      {/* Grouped Recommendations */}
                      <div className="space-y-10">
                        {siteValue(categories.map(cat => {
                          const items = session.recommendations.filter(r => r.category === cat);
                          if (items.length === 0) return null;

                          return (
                            <div key={cat} className="space-y-4">
                              <h4 className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">{siteValue(cat)}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {siteValue(items.map(item => {
                                  const isAdded = project.shoppingList.includes(item.id);
                                  
                                  return (
                                    <div 
                                      key={item.id}
                                      className="group relative flex gap-4 p-3 bg-secondary/10 hover:bg-secondary/20 rounded-[20px] border border-transparent transition-all"
                                    >
                                      <div className="w-20 h-20 rounded-[14px] overflow-hidden border border-border/50 shrink-0 relative">
                                        <ImageWithFallback src={item.image} alt={siteValue(item.name)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        {siteValue(isAdded && (
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                                              <Check size={18} strokeWidth={3} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div className="flex justify-between items-start">
                                          <div className="min-w-0">
                                            <h5 className="text-[13px] font-bold text-foreground truncate">{siteValue(item.name)}</h5>
                                            <span className="text-[11px] text-muted-foreground truncate block">{siteValue(item.store)}</span>
                                          </div>
                                          <button className="text-muted-foreground hover:text-foreground p-1">
                                            <MoreHorizontal size={14} />
                                          </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                          <div className="flex items-baseline gap-1">
                                            <span className="text-[14px] font-bold text-foreground">{siteValue(formatPriceFromRial(item.price, false))}</span>
                                            <span className="text-[9px] font-medium text-muted-foreground">{siteText("تومان")}</span>
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                            <button 
                                              onClick={() => onLikeProduct(item.id, true)}
                                              className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-border flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
                                            >
                                              <Heart size={12} />
                                            </button>
                                            <button 
                                              disabled={isAdded}
                                              onClick={() => onAddToShoppingList(item.id)}
                                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isAdded ? 'bg-green-500 text-white' : 'bg-foreground text-background active:scale-90'}`}
                                            >
                                              {siteValue(isAdded ? <Check size={14} /> : <Plus size={14} />)}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }))}
                              </div>
                            </div>
                          );
                        }))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
