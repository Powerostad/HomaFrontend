import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Sparkles,
  FolderOpen,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Header } from '../../components/Header';
import { useStudio } from '../../context/AppProviders';
import { Button } from '../../components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

interface ProjectDisplay {
  id: string;
  name: string;
  createdAt: string;
  thumbnail?: string;
  style?: string;
  location?: string;
}

export function StudioProjectsDashboard() {
  const navigate = useNavigate();
  const { studioProjects } = useStudio();

  const projects = studioProjects.length > 0 ? studioProjects : [
    {
      id: 'p1',
      name: 'آپارتمان شماره ۱۲ - فضای داخلی',
      createdAt: '2025-12-15T10:30:00Z',
      thumbnail: 'https://images.unsplash.com/photo-1674504982182-e2ae3c9634bf?q=80&w=1200&auto=format&fit=crop',
      style: 'Minimalist Editorial',
      location: 'تهران، جردن'
    },
    {
      id: 'p2',
      name: 'ویلا لواسان - اتاق خواب مستر',
      createdAt: '2025-11-20T14:45:00Z',
      thumbnail: 'https://images.unsplash.com/photo-1713283365745-a727fb26c52f?q=80&w=1200&auto=format&fit=crop',
      style: 'Neutral Aesthetic',
      location: 'لواسان'
    },
    {
      id: 'p3',
      name: 'پروژه بازسازی - نشیمن',
      createdAt: '2026-01-02T09:15:00Z',
      thumbnail: 'https://images.unsplash.com/photo-1753791913941-efa7de4e1b5c?q=80&w=1200&auto=format&fit=crop',
      style: 'Modern Scandinavian',
      location: 'اصفهان'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col" dir="rtl">
      <Header transparent={false} />
      
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-20 py-20 md:py-32">
        {/* Editorial Page Title */}
        <div className="mb-24 md:mb-40 flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-subtle)] pb-12 gap-8">
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-accent tracking-[0.3em] uppercase block mb-4">Architecture & Interior</span>
            <h1 className="text-[42px] md:text-[64px] font-light leading-none tracking-tight text-[var(--jet-black)]">
              استودیو <span className="font-bold">هُما</span>
            </h1>
            <p className="text-[15px] text-[var(--muted-foreground)] max-w-md leading-relaxed mt-6">
              آرشیو پروژه‌های شخصی و مستر-پلن‌های طراحی شده با هوش مصنوعی.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/studio/upload')}
            className="group flex items-center gap-4 text-[var(--jet-black)] hover:text-accent transition-all"
          >
            <span className="text-[13px] font-bold tracking-[0.2em] uppercase border-b border-[var(--jet-black)] pb-1 group-hover:border-accent">Create New Project</span>
            <Plus size={20} strokeWidth={1} />
          </button>
        </div>

        {/* Asymmetrical Journal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-24 md:gap-x-16">
          {projects.map((project: ProjectDisplay, idx: number) => {
            // Asymmetrical layout logic: 1st is large, 2nd and 3rd are smaller
            const colSpan = idx % 3 === 0 ? "md:col-span-8" : "md:col-span-4";
            const isLarge = idx % 3 === 0;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                onClick={() => navigate(`/studio/project/${project.id}`)}
                className={`${colSpan} group cursor-pointer`}
              >
                <div className={`relative overflow-hidden mb-8 bg-white ${isLarge ? 'aspect-[16/10]' : 'aspect-[3/4]'}`}>
                  <ImageWithFallback 
                    src={project.thumbnail} 
                    alt={project.name} 
                    className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                  />
                  {/* Subtle corner label */}
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-[9px] font-bold text-white bg-black/20 backdrop-blur-sm px-2 py-1 uppercase tracking-widest">
                      Project No. 0{idx + 1}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.15em] uppercase text-accent">
                    <span>{project.style}</span>
                    <span className="text-[var(--muted-foreground)] opacity-50 font-medium">/ {project.location}</span>
                  </div>
                  <h2 className="text-[24px] md:text-[28px] font-medium text-[var(--jet-black)] group-hover:translate-x-[-10px] transition-transform duration-700">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-6 pt-4 border-t border-[var(--border-subtle)]">
                    <span className="text-[12px] text-[var(--muted-foreground)] italic">مشاهده جزئیات طرح</span>
                    <ArrowRight size={16} className="text-[var(--jet-black)] opacity-0 group-hover:opacity-100 group-hover:translate-x-[-5px] transition-all" />
                  </div>
                </div>
              </motion.div>
            );
          })}

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
            <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-[var(--jet-black)]">New Canvas</span>
            <p className="text-[13px] text-[var(--muted-foreground)] mt-4 text-center max-w-[180px]">
              شروع یک طراحی هوشمند جدید در فضای استودیو
            </p>
          </div>
        </div>

        {/* Editorial Stats Footer */}
        <div className="mt-64 grid grid-cols-2 md:grid-cols-4 gap-12 py-20 border-t border-[var(--jet-black)]">
           {[
             { label: 'Active Projects', val: studioProjects.length || 3 },
             { label: 'AI Simulations', val: '142+' },
             { label: 'Curated Items', val: '890+' },
             { label: 'Studio Credits', val: 'Premium' }
           ].map((stat, sIdx) => (
             <div key={sIdx} className="space-y-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{stat.label}</span>
               <div className="text-[24px] font-light text-[var(--jet-black)]">{stat.val}</div>
             </div>
           ))}
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