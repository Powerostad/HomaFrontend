/**
 * Shared workspace molecules for the Room Redesign flow — used by BOTH the
 * desktop columns (desktop.tsx) and the mobile sheet (RoomRedesignPage mobile
 * branch). Keeping these in one place is what makes the two surfaces feel like
 * one product: identical image chrome, identical actions, identical tokens.
 *
 *  - CanvasCaption   (kicker + title above/beside the image)
 *  - ImageToolbar    (glass pill: download · share · compare · zoom)
 *  - ZoomModal / CompareModal
 *  - QuickEditChips  (static follow-up prompts)
 *  - useImageActions (DRY download/share + zoom/compare state + the modals)
 *
 * All visual values come from theme.ts tokens (RD / FRAME). No literals here.
 */
import { useState, type ReactNode } from 'react';
import {
  X,
  Download,
  Share2,
  Maximize2,
  GitCompareArrows,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { BeforeAfterSlider } from '@/components/BeforeAfterSlider';
import { SimpleDialog } from '@/components/SimpleDialog';
import { downloadImage } from '@/utils/downloadUtils';
import { RD } from '../theme';
import { DESKTOP_QUICK_EDITS } from '../data/mockData';

// ── CanvasCaption ───────────────────────────────────────────────────
export function CanvasCaption({ kicker, title, align = 'right' }: { kicker: string; title: string; align?: 'right' | 'center' }) {
  return (
    <div className="shrink-0" style={{ fontFamily: 'Vazirmatn', textAlign: align }}>
      <p style={{ fontSize: 11, letterSpacing: '0.14em', color: RD.inkSoft, fontWeight: 600 }}>{kicker}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: RD.ink, marginTop: 2 }}>{title}</p>
    </div>
  );
}

// ── Toolbar ─────────────────────────────────────────────────────────
function ToolbarButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const bg = active ? RD.accentGreenBg : hover ? RD.hoverOverlay : 'transparent';
  const color = active ? RD.accentGreen : hover ? RD.ink : RD.inkSoft;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-9 h-9 rounded-[10px] flex items-center justify-center transition disabled:opacity-40 disabled:pointer-events-none"
      style={{ background: bg, color }}
    >
      <Icon size={17} strokeWidth={1.75} />
    </button>
  );
}

export function ImageToolbar({
  canCompare,
  onDownload,
  onShare,
  onCompare,
  onZoom,
  variant = 'glass',
}: {
  canCompare: boolean;
  onDownload: () => void;
  onShare: () => void;
  onCompare: () => void;
  onZoom: () => void;
  /** 'glass' = floating frosted pill (over the warm canvas, desktop). 'bare' =
   *  ghost icon row with no surface (flush sheet chrome on a white mobile sheet). */
  variant?: 'glass' | 'bare';
}) {
  const buttons = (
    <>
      <ToolbarButton icon={Download} label="دانلود" onClick={onDownload} />
      <ToolbarButton icon={Share2} label="اشتراک‌گذاری" onClick={onShare} />
      <span className="w-px self-stretch my-1.5" style={{ backgroundColor: RD.line }} />
      <ToolbarButton icon={GitCompareArrows} label="مقایسه" disabled={!canCompare} onClick={onCompare} />
      <ToolbarButton icon={Maximize2} label="بزرگ‌نمایی" onClick={onZoom} />
    </>
  );

  if (variant === 'bare') {
    return (
      <div className="shrink-0 flex items-center gap-0.5" dir="rtl">
        {buttons}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 flex items-center"
      dir="rtl"
      style={{
        background: RD.glassBg,
        backdropFilter: RD.glassBlur,
        WebkitBackdropFilter: RD.glassBlur,
        borderRadius: 14,
        border: `1px solid ${RD.line}`,
        boxShadow: RD.toolbarShadow,
        padding: 6,
        gap: 2,
      }}
    >
      {buttons}
    </div>
  );
}

// ── Modals ──────────────────────────────────────────────────────────
function ModalClose({ onClose }: { onClose: () => void }) {
  // RTL: leading corner is the physical top-RIGHT → close sits there.
  return (
    <button
      type="button"
      aria-label="بستن"
      onClick={onClose}
      className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-md"
      style={{ backgroundColor: RD.modalCloseBg }}
    >
      <X size={18} strokeWidth={2} style={{ color: RD.ink }} />
    </button>
  );
}

export function ZoomModal({ src, open, onClose }: { src: string; open: boolean; onClose: () => void }) {
  return (
    <SimpleDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <div className="relative" style={{ width: '90vw', height: '88vh' }} dir="rtl">
        <div
          className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
          style={{ backgroundColor: RD.cream }}
        >
          <img src={src} alt="پیش‌نمایش" className="max-w-full max-h-full object-contain" />
        </div>
        <ModalClose onClose={onClose} />
      </div>
    </SimpleDialog>
  );
}

export function CompareModal({
  before,
  after,
  open,
  onClose,
}: {
  before: string;
  after: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SimpleDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <div className="relative" style={{ width: 'min(90vw, 1100px)' }} dir="rtl">
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${RD.line}` }}>
          <BeforeAfterSlider beforeImage={before} afterImage={after} priority />
        </div>
        <ModalClose onClose={onClose} />
      </div>
    </SimpleDialog>
  );
}

// ── QuickEditChips ──────────────────────────────────────────────────
// Static follow-up prompts; tapping one sends it as the next conversation turn.
export function QuickEditChips({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap gap-2" dir="rtl" style={{ fontFamily: 'Vazirmatn' }}>
      {DESKTOP_QUICK_EDITS.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c.label)}
          className="rounded-full transition disabled:opacity-50"
          style={{ border: `1px solid ${RD.line}`, fontSize: 12.5, padding: '6px 12px', color: RD.ink, backgroundColor: '#FFFFFF' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = RD.chipHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

// ── useImageActions ─────────────────────────────────────────────────
// Single home for the image actions (download / share) + zoom/compare modal
// state, so desktop and mobile behave identically. Returns toolbar props, the
// `canCompare` flag, and the rendered modals to drop into the tree.
export function useImageActions({
  image,
  originalImage,
  activeVersion,
  isPreview,
}: {
  image: string | null;
  originalImage: string | null;
  activeVersion: number;
  isPreview: boolean;
}): {
  canCompare: boolean;
  onDownload: () => void;
  onShare: () => void;
  onZoom: () => void;
  onCompare: () => void;
  modals: ReactNode;
} {
  const [zoom, setZoom] = useState(false);
  const [compare, setCompare] = useState(false);
  const canCompare = !!(originalImage && image && originalImage !== image && isPreview);

  const onDownload = async () => {
    if (!image) return;
    toast.loading('در حال آماده‌سازی دانلود…', { id: 'dl' });
    try {
      const res = await downloadImage({ imageUrl: image, filename: `homa-${activeVersion}`, useAuth: false });
      if (res.success) toast.success('تصویر ذخیره شد', { id: 'dl' });
      else toast.error('دانلود ناموفق بود', { id: 'dl' });
    } catch {
      toast.error('دانلود ناموفق بود', { id: 'dl' });
    }
  };

  const onShare = async () => {
    if (!image) return;
    try {
      if (navigator.share) await navigator.share({ title: 'پیش‌نمایش طراحی هما', url: image });
      else {
        await navigator.clipboard.writeText(image);
        toast.success('لینک تصویر کپی شد');
      }
    } catch {
      /* user cancelled share — no-op */
    }
  };

  const modals = (
    <>
      {image && <ZoomModal src={image} open={zoom} onClose={() => setZoom(false)} />}
      {canCompare && originalImage && image && (
        <CompareModal before={originalImage} after={image} open={compare} onClose={() => setCompare(false)} />
      )}
    </>
  );

  return {
    canCompare,
    onDownload,
    onShare,
    onZoom: () => setZoom(true),
    onCompare: () => setCompare(true),
    modals,
  };
}
