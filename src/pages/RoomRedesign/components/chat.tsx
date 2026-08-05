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
  Droplet,
  Check,
  Loader2,
  Info,
  ImageDown,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useRef, type ReactNode, type Ref } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { RD } from '../theme';
import type { ChatEventKind, ChatMessage, Chip as ChipType, ChipGroup } from '../types';
import type { RoomFinding } from '../services/transformers';

const TAP = { scale: 0.97 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

/** هما avatar diameter — also the width of the run's left gutter, so bubbles
 *  and indicators in a run share one alignment system. */
const AVATAR_SIZE = 28;

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

// ── HomaAvatar (assistant identity mark — consistent with desktop) ──
export function HomaAvatar({ size = AVATAR_SIZE }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: RD.ink }}
      aria-hidden
    >
      <Droplet size={Math.round(size * 0.5)} strokeWidth={2} color="#fff" />
    </span>
  );
}

// ── UserBubble (the user's own turn — right side, green tint) ───────
function UserBubble({ message }: { message: ChatMessage }) {
  if (!message.text?.trim() && !message.imageUrl) return null;
  return (
    <div className="flex flex-col items-start">
      <div
        className="flex items-center gap-2.5 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]"
        style={{ backgroundColor: RD.accentGreenBg, border: `1px solid ${RD.accentGreenBorder}` }}
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
        {message.text?.trim() && (
          <span className="text-[13px]" style={{ color: RD.ink, lineHeight: 1.9 }}>
            {message.text}
          </span>
        )}
      </div>
      {message.time && (
        <span className="text-[10px] mt-1" style={{ color: RD.inkMuted, fontFamily: 'Vazirmatn' }}>{message.time}</span>
      )}
    </div>
  );
}

// ── AssistantBubble (one هما bubble inside a run; no avatar of its own) ─
// The run's first bubble nips its RTL leading corner (top-right) to point back
// at the avatar; follow-on bubbles are fully rounded so the run reads as a unit.
function AssistantBubble({ message, isFirstInRun }: { message: ChatMessage; isFirstInRun: boolean }) {
  if (!message.text?.trim()) return null;
  return (
    <div className="flex flex-col items-start" style={{ gap: 4, maxWidth: '100%', minWidth: 0 }}>
      <div
        style={{
          backgroundColor: RD.panel,
          border: `1px solid ${RD.line}`,
          borderRadius: 16,
          borderTopRightRadius: isFirstInRun ? 4 : 16,
          boxShadow: RD.bubbleShadow,
          padding: '10px 14px',
          maxWidth: '100%',
        }}
      >
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.9,
            color: RD.ink,
            fontFamily: 'Vazirmatn',
            margin: 0,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
          }}
        >
          {message.text}
        </p>
      </div>
      {message.time && (
        <span className="text-[10px]" style={{ color: RD.inkMuted, fontFamily: 'Vazirmatn' }}>{message.time}</span>
      )}
    </div>
  );
}

// ── RunHeader (هما identity — shown once per run, top of the column) ─
function RunHeader({ time }: { time?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] font-semibold" style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}>هما</span>
      {time && (
        <span className="text-[10px]" style={{ color: RD.inkMuted, fontFamily: 'Vazirmatn' }}>{time}</span>
      )}
    </div>
  );
}

// ── AssistantRun (a maximal run of consecutive هما messages) ─────────
// One avatar in a left gutter + a content column (identity header → bubbles →
// any injected content). Killing the per-message avatar removes the orphan
// droplets; the avatar is top-aligned so it sits beside where هما starts.
function AssistantRun({
  messages,
  showHeader = true,
  children,
}: {
  messages: ChatMessage[];
  showHeader?: boolean;
  children?: ReactNode;
}) {
  // Header timestamp = first message in the run that carries one.
  const headerTime = messages.find((m) => m.time)?.time;
  return (
    <div className="flex justify-end items-start gap-2" dir="rtl">
      <div className="flex flex-col items-start gap-1.5 flex-1 min-w-0">
        {showHeader && <RunHeader time={headerTime} />}
        {messages.map((m, i) => (
          <AssistantBubble key={m.id} message={m} isFirstInRun={i === 0} />
        ))}
        {children}
      </div>
      <HomaAvatar />
    </div>
  );
}

// ── SystemEvent (operational status / error — NOT هما's voice) ───────
// Centered, avatar-less, bubble-less pill tinted by severity, so a "render
// ready" notice or a failure reads as infrastructure, distinct from the chat.
const EVENT_STYLE: Record<ChatEventKind, { bg: string; border: string; text: string; icon: LucideIcon }> = {
  info: { bg: RD.greenTintBg, border: RD.line, text: RD.inkMuted, icon: Info },
  success: { bg: RD.accentGreenBg, border: RD.accentGreenBorder, text: RD.accentGreen, icon: ImageDown },
  error: { bg: RD.dangerBg, border: 'rgba(93,13,2,0.20)', text: RD.danger, icon: AlertCircle },
};

export function SystemEvent({ message }: { message: ChatMessage }) {
  const s = EVENT_STYLE[message.eventKind ?? 'info'];
  const Icon = s.icon;
  return (
    <div className="flex justify-center" style={{ padding: '2px 0' }} dir="rtl">
      <div
        role="status"
        className="inline-flex items-center gap-1.5"
        style={{
          maxWidth: '85%',
          padding: '5px 12px',
          borderRadius: 999,
          backgroundColor: s.bg,
          border: `1px solid ${s.border}`,
          fontFamily: 'Vazirmatn',
        }}
      >
        <Icon size={13} strokeWidth={2} color={s.text} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, lineHeight: 1.5, color: s.text, textAlign: 'center' }}>{message.text}</span>
      </div>
    </div>
  );
}

// ── ChatBubble (standalone single message — used by the Preview panel) ─
// A convenience wrapper that renders one message in the correct register:
// user bubble, system event, or a one-message هما run (avatar + header).
export function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') return <UserBubble message={message} />;
  if (message.kind === 'event') return <SystemEvent message={message} />;
  if (!message.text?.trim()) return null;
  return <AssistantRun messages={[message]} />;
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
      aria-pressed={selected}
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
  layout?: 'scroll' | 'grid' | 'wrap';
}) {
  const reduce = useReducedMotion();
  const chips = group.chips.map((chip, i) => (
    <motion.div
      key={chip.id}
      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : i * 0.04, duration: 0.2, ease: 'easeOut' }}
      className={layout === 'scroll' ? 'shrink-0' : ''}
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
      ) : layout === 'wrap' ? (
        <div className="flex flex-wrap gap-2">{chips}</div>
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-0.5">{chips}</div>
      )}
    </div>
  );
}

/** Placeholder that reflects هما's state so a locked input explains itself. */
export function inputPlaceholder(busy: boolean, rendering: boolean): string {
  if (rendering) return 'هما در حال ساخت تصویر است…';
  if (busy) return 'هما در حال پاسخ‌گویی است…';
  return 'پیامت رو بنویس…';
}

// ── MessageInput ────────────────────────────────────────────────────
// While هما is working (`disabled`) the field is locked and the send button
// dimmed — the user can't fire a second request mid-generation.
export function MessageInput({
  placeholder,
  value,
  onChange,
  onSend,
  disabled = false,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    window.addEventListener('homa-redesign-focus-composer', focus);
    return () => window.removeEventListener('homa-redesign-focus-composer', focus);
  }, []);
  return (
    <div
      className="flex items-center gap-2 rounded-full pl-1 pr-4 py-2"
      style={{
        backgroundColor: disabled ? RD.cream : '#fff',
        border: `1px solid ${RD.lineSoft}`,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        aria-label="پیام"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled) onSend();
        }}
        className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-right disabled:cursor-not-allowed"
        style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}
      />
      <motion.button
        type="button"
        aria-label="ارسال"
        onClick={onSend}
        disabled={disabled}
        whileTap={disabled ? undefined : TAP}
        transition={SPRING}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:cursor-not-allowed"
        style={{ backgroundColor: RD.green, opacity: disabled ? 0.45 : 1 }}
      >
        <Send size={15} strokeWidth={2} color="#fff" style={{ transform: 'scaleX(-1)' }} />
      </motion.button>
    </div>
  );
}

// ── TypingDots (هما is composing) ───────────────────────────────────
// Inner pill only; the avatar/column is supplied by the AssistantRun wrapper.
export function TypingDots() {
  return (
    <div
      role="status"
      aria-label="هما در حال تایپ است"
      className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl"
      style={{ backgroundColor: RD.panel, border: `1px solid ${RD.line}`, borderTopRightRadius: 4, fontFamily: 'Vazirmatn' }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: RD.inkMuted }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── RenderingIndicator (هما is generating the image) ────────────────
// A distinct, clearly-progress state (not a chat bubble of canned text):
// spinning mark + animated label + shimmer bar so the user knows an image is
// being built and the conversation is paused. Inner pill only; the avatar/column
// comes from the AssistantRun wrapper.
export function RenderingIndicator() {
  return (
    <div
      role="status"
      aria-label="هما در حال ساخت تصویر است"
      className="flex flex-col gap-2 rounded-2xl px-3.5 py-3 w-full"
      style={{ backgroundColor: RD.accentGreenBg, border: `1px solid ${RD.accentGreenBorder}`, borderTopRightRadius: 4, fontFamily: 'Vazirmatn' }}
    >
      <div className="flex items-center gap-2">
        <Loader2 size={15} strokeWidth={2.5} className="animate-spin" style={{ color: RD.accentGreen }} />
        <span className="text-[13px] font-medium" style={{ color: RD.ink }}>در حال ساخت تصویر…</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: RD.accentGreenTrack }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: RD.accentGreen, width: '40%' }}
          animate={{ x: ['-110%', '260%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

// ── FindingsList (room analysis: gaps + strengths) ──────────────────
/** One row per finding: status icon + short label + the full Persian explanation. */
function FindingRow({ finding }: { finding: RoomFinding }) {
  const good = finding.status === 'good';
  const dot = good ? RD.greenSoft : RD.danger;
  return (
    <div className="flex items-start gap-2.5 py-2.5" style={{ fontFamily: 'Vazirmatn' }}>
      <span
        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: dot }}
      >
        {good ? <Check size={12} strokeWidth={3} color="#fff" /> : <span className="text-[12px] font-bold leading-none text-white">!</span>}
      </span>
      <div className="min-w-0">
        {finding.label && (
          <p className="text-[13px] font-medium leading-tight" style={{ color: RD.ink }}>{finding.label}</p>
        )}
        {finding.description && (
          <p className="text-[12px] mt-0.5 leading-[1.7]" style={{ color: RD.inkSoft }}>{finding.description}</p>
        )}
      </div>
    </div>
  );
}

export function FindingsList({ findings }: { findings: RoomFinding[] }) {
  if (findings.length === 0) return null;
  const goods = findings.filter((f) => f.status === 'good');
  const gaps = findings.filter((f) => f.status === 'bad');
  return (
    <div className="space-y-3">
      {gaps.length > 0 && (
        <div>
          <h3 className="text-[13px] font-semibold" style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}>نکات قابل بهبود</h3>
          <div style={{ borderTop: `1px solid ${RD.line}` }}>
            {gaps.map((f) => <FindingRow key={f.id} finding={f} />)}
          </div>
        </div>
      )}
      {goods.length > 0 && (
        <div>
          <h3 className="text-[13px] font-semibold" style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}>نقاط قوت فضا</h3>
          <div style={{ borderTop: `1px solid ${RD.line}` }}>
            {goods.map((f) => <FindingRow key={f.id} finding={f} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FindingsMessage (the room analysis, as a هما chat message) ──────
// The findings ARE هما's first answer, so they live inline in the thread —
// a هما-styled card (current ! / ✓ symbols) anchored to the first turn — NOT a
// block that trails the latest message every turn. Avatar/column comes from the
// AssistantRun it is injected into.
export function FindingsMessage({ findings }: { findings: RoomFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <div
      className="rounded-2xl px-3.5 py-3 w-full"
      style={{ backgroundColor: RD.panel, border: `1px solid ${RD.line}`, boxShadow: RD.bubbleShadow }}
    >
      <FindingsList findings={findings} />
    </div>
  );
}

// ── Message grouping ────────────────────────────────────────────────
// Collapse the flat message list into render items: a user turn, an event pill,
// or a "run" — a maximal contiguous block of هما messages that shares one avatar.
// kind === 'event' breaks a run; absent/'message' counts as a run member so
// hydrated old sessions (no kind persisted) still group correctly.
type GroupedItem =
  | { type: 'user'; message: ChatMessage }
  | { type: 'event'; message: ChatMessage }
  | { type: 'run'; messages: ChatMessage[] };

function groupMessages(msgs: ChatMessage[]): GroupedItem[] {
  const out: GroupedItem[] = [];
  for (const m of msgs) {
    if (m.role === 'user') {
      out.push({ type: 'user', message: m });
      continue;
    }
    if (m.kind === 'event') {
      out.push({ type: 'event', message: m });
      continue;
    }
    const last = out[out.length - 1];
    if (last?.type === 'run') last.messages.push(m);
    else out.push({ type: 'run', messages: [m] });
  }
  return out;
}

// ── ChatThread ──────────────────────────────────────────────────────
// THE single conversation body shared by the mobile sheet (AnalysisPanel) and
// the desktop sidebar (ChatPanel). Renders: optional leading slot → grouped
// messages → typing/rendering indicator → chip questions → scroll anchor.
// Layout shells (sheet vs sidebar) and the message input stay per-surface;
// everything inside the scroll region lives here so a fix lands once.
export function ChatThread({
  messages,
  chipGroups,
  onSelectChip,
  busy,
  rendering = false,
  findings,
  chipLayout = 'scroll',
  leading,
  endRef,
}: {
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  onSelectChip: (groupId: string, chipId: string) => void;
  busy: boolean;
  rendering?: boolean;
  findings: RoomFinding[];
  chipLayout?: 'scroll' | 'wrap';
  leading?: ReactNode;
  endRef?: Ref<HTMLDivElement>;
}) {
  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';
  // Image generation gets its own progress UI; plain text turns get typing dots.
  const showTyping = busy && !rendering && lastIsUser;
  const items = groupMessages(messages);
  // Findings are هما's FIRST answer — inject them inside the first run so they
  // stay anchored to the opening turn instead of trailing every new message.
  const firstRunIdx = items.findIndex((it) => it.type === 'run');
  return (
    <div className="space-y-3" dir="rtl">
      {leading}
      {items.map((it, i) => {
        if (it.type === 'user') return <UserBubble key={it.message.id} message={it.message} />;
        if (it.type === 'event') return <SystemEvent key={it.message.id} message={it.message} />;
        return (
          <AssistantRun key={it.messages[0].id} messages={it.messages}>
            {i === firstRunIdx && findings.length > 0 && <FindingsMessage findings={findings} />}
          </AssistantRun>
        );
      })}
      {showTyping && (
        <AssistantRun messages={[]} showHeader={false}>
          <TypingDots />
        </AssistantRun>
      )}
      {rendering && (
        <AssistantRun messages={[]} showHeader={false}>
          <RenderingIndicator />
        </AssistantRun>
      )}
      {chipGroups.map((g) => (
        <ChipRow key={g.id} group={g} layout={chipLayout} onSelect={(chipId) => onSelectChip(g.id, chipId)} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
