import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { MoreVertical, Share2, Trash2, Pin, PinOff } from 'lucide-react';
import { toPersianDigits } from '../../utils/helpers'; // I'll create this helper

interface ResultCardProps {
  result: {
    id: string;
    coverImage: string;
    productName: string;
    storeName: string;
    timestamp: string;
    isPinned: boolean;
  };
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClick: (id: string) => void;
}

export function ResultCard({ result, onDelete, onShare, onTogglePin, onClick }: ResultCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col gap-3 cursor-pointer"
      onClick={() => onClick(result.id)}
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/5] bg-secondary rounded-[var(--radius-card)] overflow-hidden border border-border transition-all duration-500 hover:shadow-xl hover:shadow-black/5">
        <ImageWithFallback 
          src={result.coverImage} 
          alt={result.productName} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        
        {/* Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Try-On</span>
          </div>
        </div>

        {/* Pin Indicator */}
        {result.isPinned && (
          <div className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-accent shadow-sm">
            <Pin size={14} className="fill-current" />
          </div>
        )}

        {/* Overlay Actions (Desktop) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors" />
        
        {/* Menu Toggle */}
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* We actually use the badge as the trigger or just a separate button */}
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between items-start px-1">
        <div className="flex flex-col gap-0.5 max-w-[80%]">
          <h5 className="text-[14px] font-bold text-foreground leading-tight truncate">
            {result.productName}
          </h5>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {result.storeName}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {result.timestamp}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-[100]" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-border z-[110] overflow-hidden p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => { onTogglePin(result.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-right"
                  >
                    {result.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    <span className="text-[13px] font-bold">{result.isPinned ? 'حذف از پین' : 'پین کردن'}</span>
                  </button>
                  <button 
                    onClick={() => { onShare(result.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-right"
                  >
                    <Share2 size={16} />
                    <span className="text-[13px] font-bold">اشتراک‌گذاری</span>
                  </button>
                  <div className="h-[1px] bg-border mx-2 my-1" />
                  <button 
                    onClick={() => { onDelete(result.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-right"
                  >
                    <Trash2 size={16} />
                    <span className="text-[13px] font-bold">حذف طرح</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}