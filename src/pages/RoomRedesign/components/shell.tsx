/**
 * Shared shell for the Room Redesign flow:
 *  - RedesignHeader  (share / هما wordmark / menu, overlaid on the image)
 *  - AnnotationPin   (floating labelled pins with connector + status dot)
 *  - RoomCanvas      (image hero + header overlay + pins + version rail)
 *  - VersionRail     (analysis-review thumbnail history)
 *  - BottomNav       (سبد / محصولات / تحلیل فضا tab dock with sliding indicator)
 */
import { Share2, Menu, Check, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { toPersianDigits } from '@/utils/formatters';
import { RD } from '../theme';
import type { AnnotationPin as PinType, NavTab, RoomVersion, PinStatus } from '../types';

const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

// ── RedesignHeader ──────────────────────────────────────────────────
export function RedesignHeader() {
  return (
    <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-4">
      {/* RTL: first child = visual-right → menu on the right, share on the left (matches design) */}
      <motion.button
        type="button"
        aria-label="منو"
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-sm shadow-sm"
      >
        <Menu size={18} strokeWidth={1.75} style={{ color: RD.ink }} />
      </motion.button>

      <span
        className="text-[24px] font-bold select-none"
        style={{ color: RD.greenMid, fontFamily: 'Vazirmatn', letterSpacing: '-0.03em' }}
      >
        هما
      </span>

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

function AnnotationPin({ pin }: { pin: PinType }) {
  const dotColor = PIN_DOT[pin.status];
  const showIcon = pin.status !== 'neutral';
  return (
    <div
      className="absolute z-20 flex flex-col items-center pointer-events-none"
      style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
    >
      {/* Pill */}
      <div
        className="flex items-center gap-1.5 rounded-full bg-white pr-3 pl-1.5 py-1 shadow-[0_4px_14px_rgba(0,0,0,0.16)]"
        style={{ fontFamily: 'Vazirmatn' }}
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
      {/* Connector + anchor dot */}
      <div
        className="w-px h-5"
        style={{ backgroundColor: 'rgba(255,255,255,0.9)', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }}
      />
      <span className="w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: dotColor }} />
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
  const ordered = [...versions].sort((a, b) => b.index - a.index); // newest on top
  return (
    <div className="absolute z-30 left-3 top-[72px] flex flex-col items-center gap-1.5">
      {ordered.map((v) => {
        const active = v.index === activeIndex;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.index)}
            className="relative w-14 h-14 rounded-lg overflow-hidden transition"
            style={{
              boxShadow: active
                ? `0 0 0 2px ${RD.green}, 0 0 0 4px rgba(255,255,255,0.6)`
                : '0 0 0 1.5px rgba(255,255,255,0.4)',
            }}
          >
            <ImageWithFallback src={v.thumbUrl} alt={`نسخه ${v.index}`} className="w-full h-full object-cover" />
            <span
              className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: active ? RD.green : 'rgba(0,0,0,0.45)' }}
            >
              {toPersianDigits(v.index)}
            </span>
          </button>
        );
      })}
      <span className="w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm shadow-sm flex items-center justify-center mt-1">
        <ChevronDown size={15} strokeWidth={2} style={{ color: RD.ink }} />
      </span>
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
}: {
  imageUrl: string;
  pins: PinType[];
  versions?: RoomVersion[];
  activeVersion?: number;
  onVersionChange?: (index: number) => void;
}) {
  return (
    <div className="relative w-full shrink-0 h-[48vh] min-h-[300px] overflow-hidden">
      <ImageWithFallback src={imageUrl} alt="اتاق" className="absolute inset-0 w-full h-full object-cover" />
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 100%)' }}
      />
      <RedesignHeader />
      {pins.map((p) => (
        <AnnotationPin key={p.id} pin={p} />
      ))}
      {versions && activeVersion != null && onVersionChange && (
        <VersionRail versions={versions} activeIndex={activeVersion} onSelect={onVersionChange} />
      )}
    </div>
  );
}

// ── BottomNav ───────────────────────────────────────────────────────
// RTL: first item renders visual-right. Order so تحلیل فضا is rightmost
// (primary tab, read first right-to-left), سبد leftmost — matches design.
const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'analysis', label: 'تحلیل فضا' },
  { id: 'products', label: 'محصولات' },
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
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
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
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
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
