/**
 * Shared shell for the Room Redesign flow:
 *  - RedesignHeader  (share / هما wordmark / menu, overlaid on the image)
 *  - AnnotationPin   (floating labelled pins with connector + status dot)
 *  - RoomCanvas      (image hero + header overlay + pins + version rail)
 *  - VersionRail     (analysis-review thumbnail history)
 *  - BottomNav       (سبد / محصولات / تحلیل فضا tab dock with sliding indicator)
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { Share2, Menu, Check, ChevronDown, RotateCcw, Droplet } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { toPersianDigits } from '@/utils/formatters';
import { RD, FRAME } from '../theme';
import type { AnnotationPin as PinType, NavTab, RoomVersion, PinStatus } from '../types';

const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

// ── RedesignHeader ──────────────────────────────────────────────────
export function RedesignHeader({ onNewSession }: { onNewSession?: () => void }) {
  return (
    <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-4">
      {/* RTL: first child = visual-right → new-session / menu on the right, share on the left */}
      <motion.button
        type="button"
        aria-label={onNewSession ? 'گفتگوی جدید' : 'منو'}
        onClick={onNewSession}
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm"
      >
        {onNewSession ? (
          <RotateCcw size={17} strokeWidth={1.9} style={{ color: RD.ink }} />
        ) : (
          <Menu size={18} strokeWidth={1.75} style={{ color: RD.ink }} />
        )}
      </motion.button>

      {/* Brand lockup — matches the desktop BrandMark (هما + droplet box). Sits on
          the warm canvas margin above the matted photo, so the dark mark reads. */}
      <div className="flex items-center gap-1.5 select-none" style={{ fontFamily: 'Vazirmatn' }}>
        <span className="text-[20px] font-bold leading-none" style={{ color: RD.ink, letterSpacing: '-0.03em' }}>هما</span>
        <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ backgroundColor: RD.ink }}>
          <Droplet size={15} strokeWidth={2} color="#fff" />
        </span>
      </div>

      <motion.button
        type="button"
        aria-label="اشتراک‌گذاری"
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm"
      >
        <Share2 size={16} strokeWidth={1.75} style={{ color: RD.ink }} />
      </motion.button>
    </div>
  );
}

// ── AnnotationPin ───────────────────────────────────────────────────
const PIN_DOT: Record<PinStatus, string> = {
  good: RD.greenSoft,
  warning: RD.warning,
  bad: RD.danger,
  neutral: RD.neutralPin,
};

/** Where the pill sits relative to its anchor dot. */
type PinSide = 'top' | 'bottom';
/** How the pill grows off the connector horizontally → keeps it inside the frame. */
type PinAlign = 'center' | 'left' | 'right';
export interface PinPlacement {
  side: PinSide;
  align: PinAlign;
}

// Pin layout tuning — all in image-fraction (%) space, so no DOM measurement.
// Only ONE pill is open at a time, so placement is per-pin: keep the pill snug
// against its dot and inside the frame. No neighbour-stacking (that floated the
// single open pill far from its dot).
const TOP_GUARD = 30; // y% under which a pill-above would clip the header/top → open below the dot
const X_LEFT = 22; // x% under which the pill grows rightward (clears the left version-rail / edge)
const X_RIGHT = 78; // x% over which the pill grows leftward (clears the right edge)

/**
 * Resolve where each pin's pill opens so it stays snug to its dot and inside the
 * frame: pins high up open downward (clear of the header), pins low open upward
 * (clear of the sheet), and pins near a side anchor their pill inward so a long
 * label never overflows. Pure function of (x,y); index-aligned to `pins`.
 */
export function layoutPins(pins: PinType[]): PinPlacement[] {
  return pins.map((p) => ({
    side: p.y < TOP_GUARD ? 'bottom' : 'top',
    align: p.x < X_LEFT ? 'left' : p.x > X_RIGHT ? 'right' : 'center',
  }));
}

export function AnnotationPin({
  pin,
  side = 'top',
  align = 'center',
  open = false,
  onToggle,
}: {
  pin: PinType;
  side?: PinSide;
  align?: PinAlign;
  /** Reveal the label pill. Closed pins are just a tappable dot. */
  open?: boolean;
  onToggle?: () => void;
}) {
  const dotColor = PIN_DOT[pin.status];
  const showIcon = pin.status !== 'neutral';
  const connectorH = 20; // short link between the dot and its label pill
  // The dot always sits on the pin's (x,y); the pill grows inward from there.
  const tx = align === 'left' ? '0' : align === 'right' ? '-100%' : '-50%';

  const pill = (
    <div
      className="flex items-center gap-1.5 rounded-full bg-white pr-3 pl-1.5 py-1"
      style={{ fontFamily: 'Vazirmatn', boxShadow: RD.pinPillShadow }}
    >
      <span className="text-[12px] font-medium leading-none whitespace-nowrap" style={{ color: RD.ink }}>
        {pin.label}
      </span>
      {showIcon && (
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: dotColor }}
        >
          {pin.status === 'good' ? (
            <Check size={12} strokeWidth={3} color="#fff" />
          ) : (
            <span className="text-[12px] font-bold leading-none text-white">!</span>
          )}
        </span>
      )}
    </div>
  );
  // Tappable dot with an enlarged transparent hit area (touch target). It is the
  // FIXED pivot: centred on (x,y) whether the pin is open or closed, so tapping
  // never moves it.
  const dot = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={pin.label}
      aria-pressed={open}
      className="pointer-events-auto absolute flex items-center justify-center"
      style={{ left: 0, top: 0, width: 28, height: 28, zIndex: 1, transform: 'translate(-50%, -50%)', touchAction: 'manipulation' }}
    >
      <span
        className="rounded-full border-2 border-white"
        style={{ width: 13, height: 13, backgroundColor: dotColor, boxShadow: RD.pinDotShadow }}
      />
    </button>
  );

  // The outer box is a ZERO-SIZE pivot at (x,y). The dot centres on it. When open,
  // the connector ALWAYS sits at the dot's x (so it links the dot, RTL or not),
  // and only the pill is offset horizontally via translateX so a long label grows
  // INWARD and never spills past the frame. side 'top' → above the dot, 'bottom'
  // → below. NB: avoid flex `items-*` for the horizontal anchor — it flips under
  // dir="rtl" and detaches the connector from the dot.
  return (
    <div className={`absolute ${open ? 'z-30' : 'z-20'} pointer-events-none`} style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
      {dot}
      {open && (
        <>
          <div
            className="absolute w-px"
            style={{
              left: 0,
              transform: 'translateX(-50%)',
              height: connectorH,
              ...(side === 'top' ? { bottom: 0 } : { top: 0 }), // meets the dot centre
              backgroundColor: RD.pinConnector,
              filter: RD.pinConnectorGlow,
            }}
          />
          <div
            className="absolute"
            style={{
              left: 0,
              transform: `translateX(${tx})`,
              ...(side === 'top' ? { bottom: connectorH } : { top: connectorH }),
              maxWidth: '75vw',
            }}
          >
            {pill}
          </div>
        </>
      )}
    </div>
  );
}

// ── PinnedImage ─────────────────────────────────────────────────────
// THE single source of truth for "room photo + annotation pins". The wrapper
// shrink-wraps the rendered image exactly (inline-block), so a pin's (x%, y%)
// always maps to the same point on the photo — identical on mobile and desktop,
// with NO JS measurement and NO waiting for load. The image keeps its aspect
// (never cropped): max-width/max-height cap it to the available box while
// width/height auto preserve the ratio. Anyone showing pins-on-a-photo uses this.
//
// Pins are tap-to-reveal: closed = a small dot (no clutter, never collides with
// the header / version rail); tapping one opens its label (one at a time). Tap
// the photo to dismiss.
export function PinnedImage({
  src,
  pins,
  maxHeight,
  className,
  imageStyle,
}: {
  src: string;
  pins: PinType[];
  /** Cap on rendered height as a CSS length (mobile: 72vh px, desktop: panel height). */
  maxHeight?: number | string;
  className?: string;
  /** Extra style for the <img> itself (e.g. desktop frame: rounding + shadow). Put
   *  the shadow HERE — not on the wrapper — so open pin pills are never clipped. */
  imageStyle?: CSSProperties;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Presigned room renders can take a beat to download — show a shimmer skeleton
  // (sized to a sensible min box so the area isn't blank) until the photo paints.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [src]);
  const placements = layoutPins(pins);
  const matRadius = (imageStyle?.borderRadius as number | undefined) ?? 0;
  return (
    <div className={`relative inline-block leading-none ${className ?? ''}`}>
      {!loaded && (
        <div className="image-loading absolute inset-0 z-0" style={{ borderRadius: matRadius }} aria-hidden />
      )}
      <img
        src={src}
        alt="اتاق"
        draggable={false}
        onClick={() => setActiveId(null)}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className="block select-none relative"
        style={{
          maxWidth: '100%',
          maxHeight,
          width: 'auto',
          height: 'auto',
          ...imageStyle,
          ...(loaded ? {} : { minWidth: 'min(78vw, 560px)', minHeight: 300 }),
          opacity: loaded ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      />
      {pins.map((p, i) => (
        <AnnotationPin
          key={p.id}
          pin={p}
          side={placements[i].side}
          align={placements[i].align}
          open={activeId === p.id}
          onToggle={() => setActiveId((id) => (id === p.id ? null : p.id))}
        />
      ))}
    </div>
  );
}

// ── VersionRail ─────────────────────────────────────────────────────
function VersionRail({
  versions,
  activeIndex,
  onSelect,
}: {
  versions: RoomVersion[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  // Collapsed by default so the rail keeps the photo's top-left corner clear of
  // pins. The chevron expands the full history; tapping it again collapses it.
  const [open, setOpen] = useState(false);
  const ordered = [...versions].sort((a, b) => a.index - b.index); // oldest on top, newest at bottom
  const active = ordered.find((v) => v.index === activeIndex) ?? ordered[0];
  const shown = open ? ordered : [active]; // collapsed → just the active thumb
  const hasMore = ordered.length > 1;

  return (
    <div className="absolute z-30 left-3 top-[72px] flex flex-col items-center gap-1.5">
      {shown.map((v) => {
        const isActive = v.index === activeIndex;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.index)}
            className="relative w-14 h-14 rounded-lg overflow-hidden transition"
            style={{
              boxShadow: isActive
                ? `0 0 0 2px ${RD.green}, 0 0 0 4px rgba(255,255,255,0.6)`
                : '0 0 0 1.5px rgba(255,255,255,0.4)',
            }}
          >
            <ImageWithFallback src={v.thumbUrl} alt={`نسخه ${v.index}`} className="w-full h-full object-cover" />
            <span
              className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: isActive ? RD.green : RD.versionBadgeInactive }}
            >
              {toPersianDigits(v.index)}
            </span>
          </button>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'بستن نسخه‌ها' : 'نمایش همه نسخه‌ها'}
          aria-expanded={open}
          className="w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm shadow-sm flex items-center justify-center mt-1"
        >
          <ChevronDown
            size={15}
            strokeWidth={2}
            style={{ color: RD.ink, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
          />
        </button>
      )}
    </div>
  );
}

// ── RoomCanvas ──────────────────────────────────────────────────────
export function RoomCanvas({
  imageUrl,
  pins,
  versions,
  activeVersion,
  onVersionChange,
  onNewSession,
}: {
  imageUrl: string | null;
  pins: PinType[];
  versions?: RoomVersion[];
  activeVersion?: number;
  onVersionChange?: (index: number) => void;
  onNewSession?: () => void;
}) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const maxH = Math.round(vh * 0.62); // cap so a tall portrait doesn't eat the whole screen

  // Same "white-mat print on warm beige" hero as desktop: the photo floats on
  // RD.canvas with padding (top clears the overlaid header) and the FRAME mat +
  // shadow live on the <img> (so pins, siblings of the img, overhang the mat and
  // are never clipped). Height stays intrinsic to the content → the sticky-scroll
  // sheet model is preserved.
  return (
    <div className="relative w-full overflow-hidden" style={{ background: RD.canvas }}>
      {imageUrl ? (
        <div className="flex items-center justify-center" style={{ padding: '60px 16px 16px' }}>
          <PinnedImage src={imageUrl} pins={pins} maxHeight={maxH} imageStyle={FRAME} />
        </div>
      ) : (
        <div className="flex items-center justify-center px-8" style={{ height: Math.round(vh * 0.26) }}>
          <span className="text-[13px] text-center leading-[1.9]" style={{ color: RD.inkSoft, fontFamily: 'Vazirmatn' }}>
            برای شروع، عکس اتاقت رو بفرست
          </span>
        </div>
      )}
      <RedesignHeader onNewSession={onNewSession} />
      {versions && activeVersion != null && onVersionChange && (
        <VersionRail versions={versions} activeIndex={activeVersion} onSelect={onVersionChange} />
      )}
    </div>
  );
}

// ── BottomNav ───────────────────────────────────────────────────────
// RTL: first item renders visual-right. Order so تحلیل فضا is rightmost
// (primary tab, read first right-to-left), سبد leftmost — matches design.
// Labels mirror the desktop workflow tabs (تحلیل فضا / پیشنهادها) so the two
// surfaces read identically; mobile keeps سبد since the basket is a tab here.
const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'analysis', label: 'تحلیل فضا' },
  { id: 'products', label: 'پیشنهادها' },
  { id: 'basket', label: 'سبد' },
];

export function BottomNav({
  active,
  onChange,
  itemCount = 0,
}: {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  itemCount?: number;
}) {
  return (
    <div
      className="shrink-0 flex justify-center"
      style={{ paddingTop: '10px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <nav
        role="tablist"
        className="flex items-center"
        style={{
          background: 'var(--glass-light)',
          backdropFilter: 'blur(var(--blur-lg))',
          WebkitBackdropFilter: 'blur(var(--blur-lg))',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '2px',
          boxShadow: RD.navShadow,
          fontFamily: 'Vazirmatn',
        }}
      >
        {NAV_ITEMS.map(({ id, label }) => {
          const isActive = id === active;
          return (
            <motion.button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="relative flex items-center justify-center gap-1.5"
              style={{
                padding: '8px 14px',
                background: isActive ? '#FFFFFF' : 'none',
                borderRadius: 'var(--radius-full)',
                boxShadow: isActive ? RD.activePillShadow : 'none',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <span
                className="text-[12px] whitespace-nowrap leading-none"
                style={{ color: isActive ? RD.ink : RD.inkSoft, fontWeight: isActive ? 600 : 400 }}
              >
                {label}
              </span>
              {id === 'basket' && itemCount > 0 && (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: RD.greenMid }}
                >
                  {toPersianDigits(Math.min(itemCount, 9))}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
