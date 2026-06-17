/**
 * Chat / conversational primitives for the Room Redesign flow:
 *  - HeaderBadge  (square brand badge; icon configurable per tab)
 *  - SheetHandle  (grab pill at the top of the bottom sheet)
 *  - ChatBubble   (user / assistant message; user can carry a photo thumb)
 *  - Chip + ChipRow (pill/card chips; scroll or 2-col grid; staggered entrance)
 *  - MessageInput (rounded input with green send button)
 */
import type { LucideIcon } from 'lucide-react';
import {
  ShoppingBag,
  PaintRoller,
  LayoutGrid,
  Image as ImageIcon,
  Heart,
  Sofa,
  Leaf,
  Shirt,
  Coins,
  Sun,
  Minimize2,
  Blinds,
  Tag,
  Send,
  Camera,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { RD } from '../theme';
import type { ChatMessage, Chip as ChipType, ChipGroup } from '../types';

const TAP = { scale: 0.97 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

// ── Icon resolver ───────────────────────────────────────────────────
const ICONS: Record<string, LucideIcon> = {
  bag: ShoppingBag,
  brush: PaintRoller,
  grid: LayoutGrid,
  image: ImageIcon,
  heart: Heart,
  sofa: Sofa,
  leaf: Leaf,
  crown: Shirt,
  shirt: Shirt,
  coins: Coins,
  sun: Sun,
  minimize: Minimize2,
  curtain: Blinds,
  tag: Tag,
};

function ChipIcon({ name, color, size = 14 }: { name?: string; color: string; size?: number }) {
  if (!name) return null;
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={1.9} color={color} />;
}

// ── HeaderBadge ─────────────────────────────────────────────────────
export function HeaderBadge({ tint = RD.green, icon: Icon = Sparkles }: { tint?: string; icon?: LucideIcon }) {
  return (
    <span
      className="w-11 h-11 rounded-none flex items-center justify-center shrink-0"
      style={{ backgroundColor: tint }}
    >
      <Icon size={22} strokeWidth={2} color="#fff" />
    </span>
  );
}

// ── SheetHandle ─────────────────────────────────────────────────────
export function SheetHandle() {
  return (
    <div className="flex justify-center pt-3 pb-2">
      <span className="w-9 h-[4px] rounded-full" style={{ backgroundColor: RD.handle }} />
    </div>
  );
}

// ── ChatBubble ──────────────────────────────────────────────────────
export function ChatBubble({ message, showAvatar = false }: { message: ChatMessage; showAvatar?: boolean }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-start">
        <div
          className="flex items-center gap-2.5 rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%]"
          style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}` }}
        >
          {message.imageUrl && (
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 order-last">
              <ImageWithFallback src={message.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-end p-0.5">
                <span className="w-4 h-4 rounded bg-white/90 flex items-center justify-center">
                  <Camera size={9} strokeWidth={2} style={{ color: RD.ink }} />
                </span>
              </div>
            </div>
          )}
          <span className="text-[13px] leading-relaxed" style={{ color: RD.ink }}>
            {message.text}
          </span>
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex justify-start items-start gap-2">
      {showAvatar && (
        <span
          className="w-8 h-8 rounded-none flex items-center justify-center shrink-0 text-white text-[11px] font-bold"
          style={{ backgroundColor: RD.green, fontFamily: 'Vazirmatn' }}
        >
          هما
        </span>
      )}
      <div
        className="rounded-2xl rounded-tr-md px-3.5 py-2.5 max-w-[88%]"
        style={{ backgroundColor: RD.cream, border: '1px solid rgba(28,28,26,0.06)' }}
      >
        <p className="text-[13px] leading-[1.85]" style={{ color: RD.ink }}>
          {message.text}
        </p>
      </div>
    </div>
  );
}

// ── Chip ────────────────────────────────────────────────────────────
export function Chip({
  chip,
  selected = false,
  variant = 'pill',
  onClick,
}: {
  chip: ChipType;
  selected?: boolean;
  variant?: 'pill' | 'card';
  onClick?: () => void;
}) {
  const color = selected ? '#FFFFFF' : RD.inkSoft;
  const base =
    variant === 'card'
      ? 'w-full justify-between rounded-none px-4 py-3.5 min-h-[52px]'
      : 'rounded-full px-3.5 py-1.5 whitespace-nowrap shrink-0';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={TAP}
      transition={SPRING}
      className={`flex items-center gap-1.5 ${base}`}
      style={{
        backgroundColor: selected ? RD.green : RD.greenTintBg,
        border: `1px solid ${selected ? RD.greenDeep : RD.line}`,
        fontFamily: 'Vazirmatn',
      }}
    >
      <ChipIcon name={chip.icon} color={color} size={variant === 'card' ? 16 : 14} />
      <span
        className={`text-[12.5px] leading-none ${selected ? 'font-semibold' : 'font-medium'}`}
        style={{ color }}
      >
        {chip.label}
      </span>
    </motion.button>
  );
}

// ── ChipRow (question + scroll row or 2-col grid; staggered entrance) ─
export function ChipRow({
  group,
  selectedId,
  onSelect,
  layout = 'scroll',
}: {
  group: ChipGroup;
  selectedId?: string;
  onSelect?: (chipId: string) => void;
  layout?: 'scroll' | 'grid';
}) {
  const reduce = useReducedMotion();
  const chips = group.chips.map((chip, i) => (
    <motion.div
      key={chip.id}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : i * 0.04, duration: 0.2, ease: 'easeOut' }}
      className={layout === 'grid' ? '' : 'shrink-0'}
    >
      <Chip
        chip={chip}
        variant={layout === 'grid' ? 'card' : 'pill'}
        selected={(selectedId ?? group.selectedId) === chip.id}
        onClick={() => onSelect?.(chip.id)}
      />
    </motion.div>
  ));

  return (
    <div className="space-y-2.5">
      {group.question && (
        <h3 className="text-[13px] font-semibold text-right" style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}>
          {group.question}
        </h3>
      )}
      {layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-2">{chips}</div>
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-0.5">{chips}</div>
      )}
    </div>
  );
}

// ── MessageInput ────────────────────────────────────────────────────
export function MessageInput({
  placeholder,
  value,
  onChange,
  onSend,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full pl-1 pr-4 py-2"
      style={{ backgroundColor: '#fff', border: `1px solid ${RD.lineSoft}` }}
    >
      <input
        type="text"
        aria-label="پیام"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
        className="flex-1 bg-transparent outline-none text-[13px] text-right"
        style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}
      />
      <motion.button
        type="button"
        aria-label="ارسال"
        onClick={onSend}
        whileTap={TAP}
        transition={SPRING}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: RD.green }}
      >
        <Send size={15} strokeWidth={2} color="#fff" style={{ transform: 'scaleX(-1)' }} />
      </motion.button>
    </div>
  );
}
