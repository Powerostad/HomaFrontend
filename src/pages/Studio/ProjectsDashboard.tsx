import { trackStudioProjectOpened, trackStudioProjectsViewed } from '@/analytics/events';
import { siteText, useSiteTranslation } from '@/i18n/siteCopy';
import type { SessionListItem } from '@/services/studioService';
import {
  ArrowRight,
  FolderOpen,
  Loader2,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedImage } from '../../components/figma/AuthenticatedImage';
import { Header } from '../../components/Header';
import { useStudio } from '../../context/StudioContext';

// Fallback projects for when no API sessions exist
const FALLBACK_PROJECTS = [
  {
    id: 'demo-1',
    name: 'نمونه طراحی - پذیرایی مدرن',
    createdAt: '2025-12-15T10:30:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1674504982182-e2ae3c9634bf?q=80&w=1200&auto=format&fit=crop',
    style: 'مینیمال',
    status: 'ready' as const
  },
  {
    id: 'demo-2',
    name: 'نمونه طراحی - اتاق خواب',
    createdAt: '2025-11-20T14:45:00Z',
    thumbnail: 'https://images.unsplash.com/photo-1713283365745-a727fb26c52f?q=80&w=1200&auto=format&fit=crop',
    style: 'اسکاندیناوی',
    status: 'ready' as const
  }
];

/**
 * Transform API session to display format
 */
function sessionToDisplay(session: SessionListItem, index: number) {
  const statusLabels: Record<string, string> = {
    'pending': siteText("در انتظار"),
    'analyzing': siteText("در حال تحلیل"),
    'generating': siteText("در حال طراحی"),
    'matching': siteText("یافتن محصولات"),
    'ready': siteText("آماده"),
    'failed': siteText("خطا")
  };

  return {
    id: session.id,
    name: `طراحی شماره ${index + 1}`,
    createdAt: session.createdAt,
    thumbnail: session.thumbnailUrl || undefined,
    style: statusLabels[session.status] || session.status,
    status: session.status,
    itemCount: session.itemCount
  };
}

export function StudioProjectsDashboard() {
  const { siteText, siteValue, siteDirection, siteLocale } = useSiteTranslation();
  const navigate = useNavigate();
  const { sessions, isLoadingSessions, loadSessions, studioProjects } = useStudio();

  const hasTrackedView = useRef(false);

  // Fetch sessions from API on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Track page view once sessions are loaded
  useEffect(() => {
    if (isLoadingSessions || hasTrackedView.current) return;
    hasTrackedView.current = true;
    trackStudioProjectsViewed({ project_count: sessions.length });
  }, [isLoadingSessions, sessions.length]);

  // Combine API sessions with legacy localStorage projects
  const displayProjects = sessions.length > 0
    ? sessions.map((s, i) => sessionToDisplay(s, i))
    : studioProjects.length > 0
      ? studioProjects.map((p) => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          thumbnail: p.thumbnail,
          style: siteText("ذخیره شده"),
          status: 'ready' as const
        }))
      : FALLBACK_PROJECTS;

  const handleProjectClick = (projectId: string, status: string) => {
    trackStudioProjectOpened({ session_id: projectId, session_status: status });

    // If ready, navigate to result page
    if (status === 'ready') {
      navigate(`/studio/result/${projectId}`);
    } else if (status === 'failed') {
      // Could show error or retry option
      navigate(`/studio/upload`);
    } else {
      // Still processing, navigate to progress page
      navigate(`/studio/progress`);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col" dir={siteDirection()}>
      <Header transparent={false} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-20 py-20 md:py-32">
        {/* Editorial Page Title */}
        <div className="mb-24 md:mb-40 flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-subtle)] pb-12 gap-8">
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-accent tracking-[0.3em] uppercase block mb-4">Architecture & Interior</span>
            <h1 className="text-[42px] md:text-[64px] font-light leading-none tracking-tight text-[var(--jet-black)]">
              {siteText("استودیو")}<span className="font-bold">{siteText("هُما")}</span>
            </h1>
            <p className="text-[15px] text-[var(--muted-foreground)] max-w-md leading-relaxed mt-6">
              {siteText("آرشیو پروژه‌های شخصی و طراحی‌های انجام شده با هوش مصنوعی.")}</p>
          </div>

          <button
            onClick={() => navigate('/studio/upload')}
            data-ph-capture-attribute-action="studio_new_project"
            className="group flex items-center gap-4 text-[var(--jet-black)] hover:text-accent transition-all"
          >
            <span className="text-[13px] font-bold tracking-[0.2em] uppercase border-b border-[var(--jet-black)] pb-1 group-hover:border-accent">{siteText("طراحی جدید")}</span>
            <Plus size={20} strokeWidth={1} />
          </button>
        </div>

        {/* Loading State */}
        {siteValue(isLoadingSessions && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-black/30" />
            <span className="text-[14px] text-[var(--muted-foreground)]">{siteText("در حال بارگذاری...")}</span>
          </div>
        ))}

        {/* Empty State */}
        {siteValue(!isLoadingSessions && displayProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <FolderOpen className="w-16 h-16 text-black/10" />
            <div className="text-center space-y-2">
              <h3 className="text-[18px] font-medium text-[var(--jet-black)]">{siteText("هنوز طراحی‌ای ندارید")}</h3>
              <p className="text-[14px] text-[var(--muted-foreground)]">{siteText("اولین طراحی هوشمند خود را با آپلود تصویر شروع کنید.")}</p>
            </div>
            <button
              onClick={() => navigate('/studio/upload')}
              className="h-12 px-8 bg-black text-white text-[13px] font-bold uppercase tracking-[0.1em] hover:bg-black/90 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              {siteText("شروع طراحی")}</button>
          </div>
        ))}

        {/* Asymmetrical Journal Grid */}
        {siteValue(!isLoadingSessions && displayProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-24 md:gap-x-16">
            {siteValue(displayProjects.map((project, idx: number) => {
              // Asymmetrical layout logic: 1st is large, 2nd and 3rd are smaller
              const colSpan = idx % 3 === 0 ? "md:col-span-8" : "md:col-span-4";
              const isLarge = idx % 3 === 0;
              const isProcessing = project.status !== 'ready' && project.status !== 'failed';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  onClick={() => handleProjectClick(project.id, project.status)}
                  className={`${colSpan} group cursor-pointer`}
                >
                  <div className={`relative overflow-hidden mb-8 bg-white ${isLarge ? 'aspect-[16/10]' : 'aspect-[3/4]'}`}>
                    {siteValue(project.thumbnail ? (
                      <AuthenticatedImage
                        src={project.thumbnail}
                        alt={siteValue(project.name)}
                        className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                        <span className="text-zinc-400">{siteText("بدون تصویر")}</span>
                      </div>
                    ))}
                    {/* Processing indicator */}
                    {siteValue(isProcessing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[12px] font-medium">{siteValue(project.style)}</span>
                        </div>
                      </div>
                    ))}
                    {/* Corner label */}
                    <div className="absolute top-0 right-0 p-4">
                      <span className="text-[9px] font-bold text-white bg-black/20 backdrop-blur-sm px-2 py-1 uppercase tracking-widest">
                        No. 0{siteValue(idx + 1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.15em] uppercase text-accent">
                      <span>{siteValue(project.style)}</span>
                      <span className="text-[var(--muted-foreground)] opacity-50 font-medium">
                        / {siteValue(new Date(project.createdAt).toLocaleDateString(siteLocale()))}
                      </span>
                    </div>
                    <h2 className="text-[24px] md:text-[28px] font-medium text-[var(--jet-black)] group-hover:translate-x-[-10px] transition-transform duration-700">
                      {siteValue(project.name)}
                    </h2>
                    <div className="flex items-center gap-6 pt-4 border-t border-[var(--border-subtle)]">
                      <span className="text-[12px] text-[var(--muted-foreground)] italic">
                        {siteValue(project.status === 'ready' ? siteText("مشاهده نتیجه") : siteText("در حال پردازش..."))}
                      </span>
                      <ArrowRight size={16} className="text-[var(--jet-black)] opacity-0 group-hover:opacity-100 group-hover:translate-x-[-5px] transition-all" />
                    </div>
                  </div>
                </motion.div>
              );
            }))}

            {/* New Project Placeholder (Editorial Style) */}
            <div
              onClick={() => navigate('/studio/upload')}
              className="md:col-span-4 flex flex-col justify-center items-center p-12 bg-white/50 border border-dashed border-[var(--border-subtle)] hover:bg-white transition-colors cursor-pointer group min-h-[500px]"
            >
              <div className="relative w-24 h-24 mb-10">
                 <div className="absolute inset-0 border border-[var(--jet-black)] group-hover:rotate-45 transition-transform duration-700" />
                 <div className="absolute inset-0 flex items-center justify-center">
                   <Plus size={32} strokeWidth={1} />
                 </div>
              </div>
              <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-[var(--jet-black)]">{siteText("طراحی جدید")}</span>
              <p className="text-[13px] text-[var(--muted-foreground)] mt-4 text-center max-w-[180px]">
                {siteText("شروع یک طراحی هوشمند جدید در فضای استودیو")}</p>
            </div>
          </div>
        ))}

        {/* Editorial Stats Footer */}
        <div className="mt-64 grid grid-cols-2 md:grid-cols-4 gap-12 py-20 border-t border-[var(--jet-black)]">
           {siteValue([
             { label: siteText("طراحی‌های فعال"), val: sessions.length || displayProjects.length },
             { label: siteText("شبیه‌سازی AI"), val: '۱۴۲+' },
             { label: siteText("محصولات کیوریت"), val: '۸۹۰+' },
             { label: siteText("اشتراک"), val: 'Premium' }
           ].map((stat, sIdx) => (
             <div key={sIdx} className="space-y-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{siteValue(stat.label)}</span>
               <div className="text-[24px] font-light text-[var(--jet-black)]">{siteValue(stat.val)}</div>
             </div>
           )))}
        </div>

        <div className="mt-20 text-center">
           <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-[0.5em] opacity-40">
             Homa Interior Intelligence — Est. 2026
           </span>
        </div>
      </main>
    </div>
  );
}
