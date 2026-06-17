/**
 * Desktop (lg+) workspace for the Room Redesign flow.
 *
 * A full-window 3-column layout (RTL): persistent chat assistant on the right,
 * the annotated room canvas in the center, the preview-history rail on the
 * left — under a top bar + 4-tab row. Editorial monochrome skin with a single
 * green accent (matches the desktop design). Reuses ImpactRow / ProductCard /
 * Chip / formatters; the mobile components are left untouched.
 */
import { useState } from 'react';
import {
  Droplet,
  Download,
  Upload,
  Share2,
  X,
  Plus,
  Paperclip,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sun,
  Check,
  Palette,
  Wallet,
  ShoppingBag,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { toPersianDigits } from '@/utils/formatters';
import { RD } from '../theme';
import { ImpactRow, ProductCard } from './products';
import type { AnnotationPin, ChatMessage, RedesignProduct } from '../types';
import {
  ANALYSIS_IMAGE,
  PREVIEW_IMAGE,
  DESKTOP_PINS,
  PREVIEW_PINS,
  DESKTOP_TABS,
  DESKTOP_MESSAGES,
  DESKTOP_PLAN,
  CHAT_QUICK_REPLIES,
  IMPACT_ITEMS,
  SUGGESTION_SUMMARY,
  SUGGESTION_PRODUCTS,
  ROOM_VERSIONS,
  EXIT_LABEL,
  CHAT_INPUT_PLACEHOLDER,
  ASSISTANT_TAGLINE,
} from '../data/mockData';

export type DeskTab = 'analysis' | 'suggestions' | 'products' | 'preview';
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

export interface DesktopWorkspaceProps {
  cart: RedesignProduct[];
  addToCart: (p: RedesignProduct) => void;
  input: string;
  setInput: (v: string) => void;
  activeVersion: number;
  setActiveVersion: (n: number) => void;
  deskTab: DeskTab;
  onTabChange: (t: DeskTab) => void;
  onExit: () => void;
}

// ── Brand mark ──────────────────────────────────────────────────────
function BrandMark() {
  return (
    <div className="flex items-center gap-2" style={{ fontFamily: 'Vazirmatn' }}>
      <span className="text-[20px] font-bold leading-none" style={{ color: RD.ink }}>هما</span>
      <span
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: RD.ink }}
      >
        <Droplet size={17} strokeWidth={2} color="#fff" />
      </span>
    </div>
  );
}

// ── Top bar ─────────────────────────────────────────────────────────
function DesktopTopBar({ onExit }: { onExit: () => void }) {
  const iconBtn = 'w-9 h-9 flex items-center justify-center rounded-md transition hover:bg-black/[0.04]';
  return (
    <header
      className="shrink-0 flex items-center justify-between px-6 h-14"
      style={{ backgroundColor: RD.cream, borderBottom: `1px solid ${RD.line}` }}
    >
      <BrandMark />
      <div className="flex items-center gap-2" dir="ltr">
        <button type="button" aria-label="دانلود" className={iconBtn}>
          <Download size={18} strokeWidth={1.75} style={{ color: RD.inkSoft }} />
        </button>
        <button type="button" aria-label="ذخیره" className={iconBtn}>
          <Upload size={18} strokeWidth={1.75} style={{ color: RD.inkSoft }} />
        </button>
        <button type="button" aria-label="اشتراک‌گذاری" className={iconBtn}>
          <Share2 size={17} strokeWidth={1.75} style={{ color: RD.inkSoft }} />
        </button>
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-full px-4 h-9 text-[13px] font-medium transition hover:bg-black/[0.02]"
          style={{ border: `1px solid ${RD.line}`, color: RD.ink, backgroundColor: '#fff', fontFamily: 'Vazirmatn' }}
        >
          <X size={15} strokeWidth={2} />
          {EXIT_LABEL}
        </button>
      </div>
    </header>
  );
}

// ── Tab row ─────────────────────────────────────────────────────────
function DesktopTabs({ active, onSelect }: { active: DeskTab; onSelect: (t: DeskTab) => void }) {
  return (
    <div
      role="tablist"
      aria-label="بخش‌های طراحی"
      className="shrink-0 flex items-center justify-center gap-9 h-12"
      style={{ backgroundColor: RD.cream, borderBottom: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}
    >
      {DESKTOP_TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(t.id as DeskTab)}
            className="relative h-full flex items-center text-[14px] transition"
            style={{
              color: isActive ? RD.ink : RD.inkSoft,
              fontWeight: isActive ? 600 : 400,
              borderBottom: `2px solid ${isActive ? RD.accentGreen : 'transparent'}`,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── History rail (left) ─────────────────────────────────────────────
function HistoryColumn({ active, onSelect }: { active: number; onSelect: (n: number) => void }) {
  const ordered = [...ROOM_VERSIONS].sort((a, b) => b.index - a.index);
  return (
    <aside
      className="hidden lg:flex w-44 shrink-0 flex-col px-3 py-4 overflow-y-auto scrollbar-hide"
      style={{ backgroundColor: RD.cream, borderRight: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}
    >
      <h3 className="text-[12px] font-semibold mb-3 px-1" style={{ color: RD.inkSoft }}>تاریخچه پیش‌نمایش‌ها</h3>
      <div className="flex flex-col gap-2.5">
        {ordered.map((v) => {
          const isActive = v.index === active;
          return (
            <button
              key={v.id}
              type="button"
              aria-label={`نسخه ${toPersianDigits(v.index)}${isActive ? ' — فعال' : ''}`}
              onClick={() => onSelect(v.index)}
              className="relative w-full aspect-[4/3] overflow-hidden rounded-md transition"
              style={{ boxShadow: isActive ? `0 0 0 2px ${RD.accentGreen}` : `0 0 0 1px ${RD.line}` }}
            >
              <ImageWithFallback src={v.thumbUrl} alt={`نسخه ${v.index}`} className="w-full h-full object-cover" />
              <span
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: isActive ? RD.accentGreen : 'rgba(28,28,26,0.55)' }}
              >
                {toPersianDigits(v.index)}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-3 w-full flex flex-col items-center justify-center gap-1.5 py-5 rounded-md text-[12px] transition hover:bg-black/[0.02]"
        style={{ border: `1.5px dashed ${RD.line}`, color: RD.inkSoft }}
      >
        <Plus size={18} strokeWidth={2} />
        ایجاد پیش‌نمایش جدید
      </button>
    </aside>
  );
}

// ── Annotation pin card (center) ────────────────────────────────────
function PinCard({ pin }: { pin: AnnotationPin }) {
  const good = pin.status === 'good';
  const dot = good ? RD.accentGreen : RD.danger;
  return (
    <div
      className="absolute z-20 w-52 pointer-events-none"
      style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)', fontFamily: 'Vazirmatn' }}
    >
      <div className="rounded-lg bg-white px-3.5 py-2.5 shadow-[0_6px_22px_rgba(28,28,26,0.14)]" style={{ border: `1px solid ${RD.line}` }}>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: dot }}>
            {good ? <Check size={12} strokeWidth={3} color="#fff" /> : <span className="text-[12px] font-bold text-white leading-none">!</span>}
          </span>
          <span className="text-[13px] font-semibold leading-tight" style={{ color: RD.ink }}>{pin.label}</span>
        </div>
        {pin.description && <p className="text-[11px] leading-[1.7] mt-1.5" style={{ color: RD.inkSoft }}>{pin.description}</p>}
      </div>
      <div className="flex flex-col items-center">
        <span className="w-px h-4" style={{ backgroundColor: dot }} />
        <span className="w-2 h-2 rounded-full border-2 border-white" style={{ backgroundColor: dot }} />
      </div>
    </div>
  );
}

// ── Zoom / brightness dock (center) ─────────────────────────────────
function ZoomDock({
  onZoomIn,
  onZoomOut,
  onReset,
  onBrightness,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onBrightness: () => void;
}) {
  const btn = 'w-9 h-9 flex items-center justify-center rounded-full transition hover:bg-black/[0.05]';
  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-full"
      dir="ltr"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 18px rgba(0,0,0,0.12)' }}
    >
      <button type="button" aria-label="بزرگ‌نمایی" className={btn} onClick={onZoomIn}>
        <ZoomIn size={18} strokeWidth={1.9} style={{ color: RD.ink }} />
      </button>
      <button type="button" aria-label="کوچک‌نمایی" className={btn} onClick={onZoomOut}>
        <ZoomOut size={18} strokeWidth={1.9} style={{ color: RD.ink }} />
      </button>
      <button type="button" aria-label="بازنشانی" className={btn} onClick={onReset}>
        <Maximize size={17} strokeWidth={1.9} style={{ color: RD.ink }} />
      </button>
      <span className="w-px h-5 mx-0.5" style={{ backgroundColor: RD.line }} />
      <button type="button" aria-label="روشنایی" className={btn} onClick={onBrightness}>
        <Sun size={18} strokeWidth={1.9} style={{ color: RD.ink }} />
      </button>
    </div>
  );
}

// ── Center canvas ───────────────────────────────────────────────────
function CenterCanvas({
  deskTab,
  cart,
  addToCart,
}: {
  deskTab: DeskTab;
  cart: RedesignProduct[];
  addToCart: (p: RedesignProduct) => void;
}) {
  const [scale, setScale] = useState(1);
  const [bright, setBright] = useState(false);

  if (deskTab === 'analysis' || deskTab === 'preview') {
    const image = deskTab === 'preview' ? PREVIEW_IMAGE : ANALYSIS_IMAGE;
    const pins = deskTab === 'preview' ? PREVIEW_PINS : DESKTOP_PINS;
    return (
      <div className="relative flex-1 min-w-0 overflow-hidden" style={{ backgroundColor: '#0c0c0c' }}>
        <div className="absolute inset-0 transition-transform duration-300" style={{ transform: `scale(${scale})`, filter: bright ? 'brightness(1.15)' : 'none' }}>
          <ImageWithFallback src={image} alt="اتاق" className="w-full h-full object-cover" />
        </div>
        {pins.map((p) => (
          <PinCard key={p.id} pin={p} />
        ))}
        <ZoomDock
          onZoomIn={() => setScale((s) => Math.min(2, s + 0.15))}
          onZoomOut={() => setScale((s) => Math.max(1, s - 0.15))}
          onReset={() => setScale(1)}
          onBrightness={() => setBright((b) => !b)}
        />
      </div>
    );
  }

  if (deskTab === 'suggestions') {
    return (
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide" style={{ backgroundColor: RD.cream }}>
        <div className="max-w-3xl mx-auto px-10 py-10" style={{ fontFamily: 'Vazirmatn' }}>
          <h2 className="text-[24px] font-medium" style={{ color: RD.ink }}>پیشنهادهای هما</h2>
          <p className="text-[13px] mt-2 leading-[1.8]" style={{ color: RD.inkSoft }}>{SUGGESTION_SUMMARY}</p>
          <div className="mt-6" style={{ borderTop: `1px solid ${RD.line}` }}>
            {IMPACT_ITEMS.map((item, i) => (
              <div key={item.id} style={i > 0 ? { borderTop: `1px solid ${RD.line}` } : undefined}>
                <ImpactRow item={item} />
              </div>
            ))}
          </div>
          <h3 className="text-[15px] font-medium mt-8 mb-4" style={{ color: RD.ink }}>محصولات پیشنهادی</h3>
          <div className="grid grid-cols-3 gap-4">
            {SUGGESTION_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // products
  return (
    <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide" style={{ backgroundColor: RD.cream }}>
      <div className="max-w-4xl mx-auto px-10 py-10" style={{ fontFamily: 'Vazirmatn' }}>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-[24px] font-medium" style={{ color: RD.ink }}>محصولات مناسب این فضا</h2>
          <span className="text-[13px]" style={{ color: RD.inkSoft }}>{toPersianDigits(cart.length)} مورد در سبد</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {SUGGESTION_PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chat panel (right) ──────────────────────────────────────────────
function DesktopBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className="flex flex-col" style={{ fontFamily: 'Vazirmatn' }}>
      <div
        className={`px-3.5 py-2.5 ${isUser ? 'rounded-2xl rounded-tr-sm self-start' : 'rounded-2xl rounded-tl-sm self-end'}`}
        style={
          isUser
            ? { backgroundColor: RD.accentGreenBg, color: RD.ink, maxWidth: '92%' }
            : { backgroundColor: '#fff', border: `1px solid ${RD.line}`, color: RD.ink, maxWidth: '94%' }
        }
      >
        <p className="text-[12.5px] leading-[1.85]">{message.text}</p>
      </div>
      {message.time && (
        <span className={`text-[10px] mt-1 ${isUser ? 'self-start' : 'self-end'}`} style={{ color: RD.inkMuted }}>
          {message.time}
        </span>
      )}
    </div>
  );
}

const PLAN_ICONS: Record<string, typeof Eye> = { palette: Palette, coins: Wallet, bag: ShoppingBag, eye: Eye };

function ChatChecklist() {
  return (
    <div className="rounded-xl bg-white px-3.5 py-3" style={{ border: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}>
      <p className="text-[12.5px] font-medium mb-2.5" style={{ color: RD.ink }}>{DESKTOP_PLAN.title}</p>
      <div className="space-y-2.5">
        {DESKTOP_PLAN.items.map((it) => {
          const Icon = PLAN_ICONS[it.icon] ?? Eye;
          return (
            <div key={it.label} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check size={15} strokeWidth={2.5} style={{ color: RD.accentGreen }} />
                <span className="text-[12.5px]" style={{ color: RD.ink }}>{it.label}</span>
              </span>
              <Icon size={15} strokeWidth={1.75} style={{ color: RD.inkMuted }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div role="status" aria-label="هما در حال تایپ است" className="self-end rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1" style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}` }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: RD.inkMuted }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function ChatPanel({
  input,
  setInput,
  onSend,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <aside className="w-72 lg:w-[340px] shrink-0 flex flex-col h-full" style={{ backgroundColor: RD.sheet, borderLeft: `1px solid ${RD.line}` }}>
      <div className="shrink-0 flex items-center gap-2.5 px-4 h-16" style={{ borderBottom: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}>
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: RD.ink }}>
          <Droplet size={16} strokeWidth={2} color="#fff" />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-bold" style={{ color: RD.ink }}>هما</p>
          <p className="text-[11px]" style={{ color: RD.inkMuted }}>{ASSISTANT_TAGLINE}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 py-4 flex flex-col gap-3.5" style={{ backgroundColor: RD.cream }}>
        <DesktopBubble message={DESKTOP_MESSAGES[0]} />
        <ChatChecklist />
        <DesktopBubble message={DESKTOP_MESSAGES[1]} />
        <DesktopBubble message={DESKTOP_MESSAGES[2]} />
        <TypingDots />
      </div>

      <div className="shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide" style={{ fontFamily: 'Vazirmatn' }}>
        {CHAT_QUICK_REPLIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] whitespace-nowrap transition hover:bg-black/[0.03]"
            style={{ border: `1px solid ${RD.line}`, color: RD.inkSoft, backgroundColor: '#fff' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="shrink-0 flex items-center gap-2 px-4 py-3" style={{ borderTop: `1px solid ${RD.line}` }}>
        <button type="button" aria-label="افزودن" className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ border: `1px solid ${RD.line}`, color: RD.inkSoft }}>
          <Plus size={16} strokeWidth={2} />
        </button>
        <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2" style={{ border: `1px solid ${RD.line}`, backgroundColor: '#fff' }}>
          <input
            type="text"
            aria-label="پیام"
            value={input}
            placeholder={CHAT_INPUT_PLACEHOLDER}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
            className="flex-1 bg-transparent outline-none text-[13px] text-right"
            style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}
          />
          <button type="button" aria-label="پیوست فایل" className="shrink-0 flex items-center justify-center">
            <Paperclip size={16} strokeWidth={1.75} style={{ color: RD.inkMuted }} />
          </button>
        </div>
        <motion.button
          type="button"
          aria-label="ارسال"
          onClick={onSend}
          whileTap={{ scale: 0.95 }}
          transition={SPRING}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: RD.accentGreen }}
        >
          <Send size={16} strokeWidth={2} color="#fff" style={{ transform: 'scaleX(-1)' }} />
        </motion.button>
      </div>
    </aside>
  );
}

// ── Workspace ───────────────────────────────────────────────────────
export function DesktopWorkspace({
  cart,
  addToCart,
  input,
  setInput,
  activeVersion,
  setActiveVersion,
  deskTab,
  onTabChange,
  onExit,
}: DesktopWorkspaceProps) {
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: RD.cream }} dir="rtl">
      <DesktopTopBar onExit={onExit} />
      <DesktopTabs active={deskTab} onSelect={onTabChange} />
      <div className="flex-1 min-h-0 flex">
        <ChatPanel input={input} setInput={setInput} onSend={() => setInput('')} />
        <CenterCanvas deskTab={deskTab} cart={cart} addToCart={addToCart} />
        <HistoryColumn active={activeVersion} onSelect={setActiveVersion} />
      </div>
    </div>
  );
}
