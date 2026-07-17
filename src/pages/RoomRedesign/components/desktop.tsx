/**
 * Desktop (lg+) workspace for the Room Redesign flow — "warm editorial" skin.
 *
 * A full-window 3-column layout (RTL): persistent هما assistant on the right,
 * the framed design-preview canvas in the center, the labelled preview-history
 * panel on the left — under a single header that carries the workflow tabs
 * (تحلیل فضا → پیشنهادها → پیش‌نمایش) plus the quiet exit / new-chat actions.
 *
 * Signature move: the render floats as a white-matted print (FRAME) on a warm
 * radial-beige canvas (RD.canvas). The mat + shadow live on the <img> itself
 * (PinnedImage `imageStyle`) so annotation pins, siblings of the img, overhang
 * the mat and are never clipped.
 *
 * Image chrome (caption / toolbar / modals / quick-edit chips) is shared with
 * the mobile sheet via components/workspace.tsx — both surfaces stay identical.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Droplet,
  X,
  Plus,
  RotateCcw,
  Check,
  Palette,
  Wallet,
  ShoppingBag,
  Eye,
  ChevronRight,
  ChevronLeft,
  ImageOff,
} from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Skeleton } from '@/components/ui/skeleton';
import { toPersianDigits } from '@/utils/formatters';
import { RD, FRAME } from '../theme';
import { ChatThread, MessageInput, inputPlaceholder } from './chat';
import { PinnedImage } from './shell';
import { CanvasCaption, ImageToolbar, QuickEditChips, useImageActions } from './workspace';
import { CategoryCard } from './categories';
import type { RoomFinding, RedesignCategory } from '../services/transformers';
import type { AnnotationPin as AnnotationPinType, ChatMessage, RedesignProduct, Chip, ChipGroup, RoomVersion } from '../types';
import { DESKTOP_TABS, DESKTOP_PLAN, EXIT_LABEL, ASSISTANT_TAGLINE } from '../data/mockData';
import { IntakeForm } from './IntakeForm';

const EMPTY_PREVIEW_HINT = 'هنوز پیش‌نمایشی ساخته نشده';
const EMPTY_PRODUCTS_HINT = 'محصولی هنوز انتخاب نشده. اول تحلیل فضا رو ببین؛ هر وقت خواستی، از هما بخواه پیشنهاد محصول بده.';

export type DeskTab = 'analysis' | 'products' | 'preview';

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
  onNewSession: () => void;
  onRender: () => void;
  // live chat
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  onSelectChip: (groupId: string, chipId: string) => void;
  busy: boolean;
  rendering: boolean;
  onSend: () => void;
  onQuickEdit: (text: string) => void;
  onAddCategory: (c: RedesignCategory) => void;
  onPreviewCategory?: (c: RedesignCategory) => void;
  // live results
  products: RedesignProduct[];
  categories: RedesignCategory[];
  hasResult: boolean;
  previewImage: string | null;
  originalImage: string | null;
  pins: AnnotationPinType[];
  findings: RoomFinding[];
  versions: RoomVersion[];
  // intake (shown in chat panel when messages.length === 0)
  showIntake: boolean;
  intakeImage: string | null;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  scopeChips: Chip[];
  scopeSelected: Set<string>;
  onToggleScope: (chipId: string) => void;
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

// ── Workflow tabs (segmented pill) ──────────────────────────────────
function WorkflowTabs({ active, onSelect }: { active: DeskTab; onSelect: (t: DeskTab) => void }) {
  return (
    <div
      role="tablist"
      aria-label="مراحل طراحی"
      className="inline-flex items-center"
      style={{ background: RD.tabTrackBg, borderRadius: 999, padding: 4, gap: 2, fontFamily: 'Vazirmatn' }}
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
            className="transition"
            style={{
              borderRadius: 999,
              padding: '7px 16px',
              fontSize: 13.5,
              color: isActive ? RD.ink : RD.inkSoft,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? '#FFFFFF' : 'transparent',
              boxShadow: isActive ? RD.activePillShadow : 'none',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Header (brand · workflow tabs · quiet actions) ──────────────────
function DesktopTopBar({
  deskTab,
  onTabChange,
  onExit,
  onNewSession,
}: {
  deskTab: DeskTab;
  onTabChange: (t: DeskTab) => void;
  onExit: () => void;
  onNewSession: () => void;
}) {
  const link = 'flex items-center gap-1.5 text-[13px] font-medium transition px-2 h-9 rounded-md hover:bg-black/[0.03]';
  return (
    <header
      className="relative shrink-0 flex items-center justify-between px-6 h-14"
      style={{ backgroundColor: RD.cream, borderBottom: `1px solid ${RD.line}` }}
    >
      <BrandMark />

      {/* Workflow tabs — centered so they read as the focal step row (RTL-safe) */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <WorkflowTabs active={deskTab} onSelect={onTabChange} />
        </div>
      </div>

      <div className="flex items-center gap-1" dir="rtl" style={{ fontFamily: 'Vazirmatn' }}>
        <button type="button" onClick={onNewSession} className={link} style={{ color: RD.inkSoft }}>
          <RotateCcw size={14} strokeWidth={2} />
          گفتگوی جدید
        </button>
        <span className="w-px h-4" style={{ backgroundColor: RD.line }} />
        <button type="button" onClick={onExit} className={link} style={{ color: RD.inkSoft }}>
          <X size={15} strokeWidth={2} />
          {EXIT_LABEL}
        </button>
      </div>
    </header>
  );
}

// ── Center canvas ───────────────────────────────────────────────────
const CANVAS_MAX_H = 'calc(100dvh - 248px)';

function DesignPreviewCanvas({
  deskTab,
  rendering,
  image,
  pins,
  originalImage,
  activeVersion,
  hasVersions,
}: {
  deskTab: DeskTab;
  rendering: boolean;
  image: string | null;
  pins: AnnotationPinType[];
  originalImage: string | null;
  activeVersion: number;
  hasVersions: boolean;
}) {
  const isPreview = deskTab === 'preview';
  const actions = useImageActions({ image, originalImage, activeVersion, isPreview });

  const kicker = isPreview ? 'پیش‌نمایش طراحی' : 'تحلیل فضا';
  const title = isPreview ? (hasVersions ? `نسخه ${toPersianDigits(activeVersion)}` : 'پیش‌نمایش') : 'عکس اصلی شما';

  return (
    <div
      className="relative flex-1 min-w-0 flex flex-col items-center justify-center"
      style={{ background: RD.canvas, padding: '32px 56px 28px' }}
    >
      {/* Caption — hidden in the empty state */}
      {(image || rendering) && (
        <div className="w-full mb-3.5">
          <CanvasCaption kicker={rendering ? 'در حال ساخت…' : kicker} title={title} />
        </div>
      )}

      {/* Frame row */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        {rendering ? (
          <div style={{ ...FRAME, width: 'min(70%, 720px)', aspectRatio: '4 / 3', overflow: 'hidden' }}>
            <Skeleton className="w-full h-full" style={{ borderRadius: 8, backgroundColor: '#EDE8DF' }} />
          </div>
        ) : image ? (
          <PinnedImage src={image} pins={pins} maxHeight={CANVAS_MAX_H} imageStyle={FRAME} />
        ) : (
          <div className="flex flex-col items-center gap-3" style={{ fontFamily: 'Vazirmatn' }}>
            <span
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#FFFFFF', border: `1px solid ${RD.line}` }}
            >
              <ImageOff size={26} strokeWidth={1.5} style={{ color: RD.inkSoft }} />
            </span>
            <span className="text-[13.5px]" style={{ color: RD.inkSoft }}>{EMPTY_PREVIEW_HINT}</span>
          </div>
        )}
      </div>

      {/* Toolbar — only when a real image is shown */}
      {image && !rendering && (
        <div className="shrink-0 self-center mt-4">
          <ImageToolbar
            canCompare={actions.canCompare}
            onDownload={actions.onDownload}
            onShare={actions.onShare}
            onCompare={actions.onCompare}
            onZoom={actions.onZoom}
          />
        </div>
      )}

      {actions.modals}
    </div>
  );
}

// ── Products canvas — guided shopping plan (grouped by design category) ──
function ProductsCanvas({
  cart,
  addToCart,
  categories,
  hasResult,
  onAddCategory,
  onPreviewCategory,
}: {
  cart: RedesignProduct[];
  addToCart: (p: RedesignProduct) => void;
  categories: RedesignCategory[];
  hasResult: boolean;
  onAddCategory: (c: RedesignCategory) => void;
  onPreviewCategory?: (c: RedesignCategory) => void;
}) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide" style={{ background: RD.canvas }}>
      <div className="max-w-5xl mx-auto px-10 py-10" style={{ fontFamily: 'Vazirmatn' }} dir="rtl">
        {!hasResult || categories.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-[15px] font-semibold" style={{ color: RD.ink }}>محصولات هنوز فعال نشده</p>
            <p className="text-[13px] leading-[1.8] max-w-[420px] mx-auto" style={{ color: RD.inkSoft }}>{EMPTY_PRODUCTS_HINT}</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-1.5">
              <h2 className="text-[24px] font-medium" style={{ color: RD.ink }}>برنامهٔ خرید برای این فضا</h2>
              <span className="text-[13px]" style={{ color: RD.inkSoft }}>{toPersianDigits(cart.length)} مورد در سبد</span>
            </div>
            <p className="text-[13px] mb-6" style={{ color: RD.inkSoft }}>
              دسته‌ها به ترتیب اولویت چیده شده‌اند؛ از بالا شروع کن.
            </p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  onAdd={addToCart}
                  onAddCategory={onAddCategory}
                  onPreviewCategory={onPreviewCategory}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Preview-history panel (left, collapsible, labelled cards) ───────
function PreviewHistoryPanel({
  versions,
  active,
  onSelect,
  onRender,
  busy,
}: {
  versions: RoomVersion[];
  active: number;
  onSelect: (n: number) => void;
  onRender: () => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(true);
  const ordered = [...versions].sort((a, b) => a.index - b.index); // oldest on top, newest at bottom

  return (
    <aside
      className="hidden lg:flex shrink-0 flex-col overflow-hidden"
      style={{
        width: open ? 240 : 64,
        transition: 'width 200ms ease',
        backgroundColor: RD.cream,
        borderRight: `1px solid ${RD.line}`,
        fontFamily: 'Vazirmatn',
      }}
    >
      {/* Header + collapse toggle. Panel sits on the visual LEFT (RTL) → collapse
          arrow points further left, expand arrow points back toward the canvas. */}
      <div className="shrink-0 flex items-center justify-between px-3 h-12" style={{ borderBottom: `1px solid ${RD.line}` }}>
        {open && <h3 className="text-[12.5px] font-semibold" style={{ color: RD.inkSoft }}>تاریخچه پیش‌نمایش‌ها</h3>}
        <button
          type="button"
          aria-label={open ? 'جمع کردن' : 'باز کردن'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="w-8 h-8 rounded-md flex items-center justify-center transition hover:bg-black/[0.04] mx-auto"
        >
          {open ? (
            <ChevronLeft size={17} strokeWidth={2} style={{ color: RD.inkSoft }} />
          ) : (
            <ChevronRight size={17} strokeWidth={2} style={{ color: RD.inkSoft }} />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3">
        {ordered.length === 0 ? (
          open && (
            <p className="text-[12px] text-center leading-[1.9] px-1 py-6" style={{ color: RD.inkSoft }}>
              {EMPTY_PREVIEW_HINT}؛ از دکمهٔ زیر شروع کن.
            </p>
          )
        ) : (
          <div className="flex flex-col gap-3">
            {ordered.map((v) => {
              const isActive = v.index === active;
              if (!open) {
                // collapsed rail → rounded thumb only
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-label={`پیش‌نمایش ${toPersianDigits(v.index)}`}
                    onClick={() => onSelect(v.index)}
                    className="relative w-10 h-10 mx-auto rounded-lg overflow-hidden transition"
                    style={{ boxShadow: isActive ? `0 0 0 2px ${RD.accentGreen}` : `0 0 0 1px ${RD.line}` }}
                  >
                    <ImageWithFallback src={v.thumbUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              }
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-label={`پیش‌نمایش ${toPersianDigits(v.index)}${isActive ? ' — فعال' : ''}`}
                  onClick={() => onSelect(v.index)}
                  className="text-right rounded-xl p-2 transition"
                  style={{
                    border: `1.5px solid ${isActive ? RD.accentGreen : 'transparent'}`,
                    backgroundColor: isActive ? RD.accentGreenBg : 'transparent',
                  }}
                >
                  <div
                    className="w-full aspect-[4/3] rounded-[10px] overflow-hidden"
                    style={{ border: RD.miniMatBorder, boxShadow: RD.thumbShadow }}
                  >
                    <ImageWithFallback src={v.thumbUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 px-0.5">
                    <span className="text-[12.5px] font-medium" style={{ color: RD.ink }}>
                      پیش‌نمایش {toPersianDigits(v.index)}
                    </span>
                    {isActive && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: RD.accentGreen }}
                      >
                        <Check size={10} strokeWidth={3} color="#fff" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New preview CTA */}
      <div className="shrink-0 p-3" style={{ borderTop: `1px solid ${RD.line}` }}>
        <button
          type="button"
          onClick={onRender}
          disabled={busy}
          aria-label="ایجاد پیش‌نمایش جدید"
          className="w-full flex items-center justify-center gap-1.5 rounded-lg transition hover:bg-black/[0.02] disabled:opacity-50"
          style={{ border: `1.5px dashed ${RD.line}`, color: RD.inkSoft, padding: open ? '12px' : '12px 0', fontSize: 12 }}
        >
          <Plus size={17} strokeWidth={2} />
          {open && (busy ? 'در حال ساخت…' : 'ایجاد پیش‌نمایش جدید')}
        </button>
      </div>
    </aside>
  );
}

// ── Assistant panel (right) ─────────────────────────────────────────
const PLAN_ICONS: Record<string, typeof Eye> = { palette: Palette, coins: Wallet, bag: ShoppingBag, eye: Eye };

function ChatChecklist() {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}>
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

function AssistantPanel({
  messages,
  chipGroups,
  onSelectChip,
  busy,
  rendering,
  findings,
  input,
  setInput,
  onSend,
  onQuickEdit,
  hasResult,
  showIntake,
  intakeImage,
  onPickImage,
  onRemoveImage,
  scopeChips,
  scopeSelected,
  onToggleScope,
}: {
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  onSelectChip: (groupId: string, chipId: string) => void;
  busy: boolean;
  rendering: boolean;
  findings: RoomFinding[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onQuickEdit: (text: string) => void;
  hasResult: boolean;
  showIntake: boolean;
  intakeImage: string | null;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  scopeChips: Chip[];
  scopeSelected: Set<string>;
  onToggleScope: (chipId: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, busy, chipGroups.length]);

  const showQuickEdits = hasResult && chipGroups.length === 0 && !showIntake && !busy && !rendering;

  return (
    <aside
      className="w-[340px] lg:w-[380px] xl:w-[400px] shrink-0 flex flex-col h-full"
      style={{ backgroundColor: RD.panel, borderLeft: `1px solid ${RD.line}` }}
    >
      {/* Identity — unboxed */}
      <div className="shrink-0 flex items-center gap-2.5 px-[18px] pt-4 pb-3" style={{ fontFamily: 'Vazirmatn' }}>
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: RD.ink }}>
          <Droplet size={16} strokeWidth={2} color="#fff" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold flex items-center gap-1.5" style={{ color: RD.ink }}>
            هما
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RD.accentGreen }} />
          </p>
          <p className="text-[12px]" style={{ color: RD.inkSoft }}>{ASSISTANT_TAGLINE}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-3.5">
        {showIntake ? (
          <IntakeForm
            variant="desktop"
            image={intakeImage}
            onPickImage={onPickImage}
            onRemoveImage={onRemoveImage}
            scopeChips={scopeChips}
            scopeSelected={scopeSelected}
            onToggleScope={onToggleScope}
          />
        ) : (
          <ChatThread
            messages={messages}
            chipGroups={chipGroups}
            onSelectChip={onSelectChip}
            busy={busy}
            rendering={rendering}
            findings={findings}
            chipLayout="wrap"
            leading={<ChatChecklist />}
            endRef={endRef}
          />
        )}
      </div>

      {showQuickEdits && (
        <div className="px-4 pb-2.5">
          <QuickEditChips onPick={onQuickEdit} disabled={busy} />
        </div>
      )}

      <div className="shrink-0 px-4 pb-4 pt-1">
        <MessageInput
          placeholder={inputPlaceholder(busy, rendering)}
          value={input}
          onChange={setInput}
          onSend={onSend}
          disabled={busy}
        />
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
  onNewSession,
  onRender,
  messages,
  chipGroups,
  onSelectChip,
  busy,
  rendering,
  onSend,
  onQuickEdit,
  onAddCategory,
  onPreviewCategory,
  categories,
  hasResult,
  previewImage,
  originalImage,
  pins,
  findings,
  versions,
  showIntake,
  intakeImage,
  onPickImage,
  onRemoveImage,
  scopeChips,
  scopeSelected,
  onToggleScope,
}: DesktopWorkspaceProps) {
  const versionImage = versions.find((v) => v.index === activeVersion)?.imageUrl ?? previewImage;
  // Analysis tab shows the user's original photo (with annotation pins); the
  // preview tab shows the selected render. Products tab swaps the canvas entirely.
  const canvasImage = deskTab === 'preview' ? versionImage : originalImage ?? versionImage;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: RD.cream }} dir="rtl">
      <DesktopTopBar deskTab={deskTab} onTabChange={onTabChange} onExit={onExit} onNewSession={onNewSession} />
      <div className="flex-1 min-h-0 flex">
        <AssistantPanel
          messages={messages}
          chipGroups={chipGroups}
          onSelectChip={onSelectChip}
          busy={busy}
          rendering={rendering}
          findings={findings}
          input={input}
          setInput={setInput}
          onSend={onSend}
          onQuickEdit={onQuickEdit}
          hasResult={hasResult}
          showIntake={showIntake}
          intakeImage={intakeImage}
          onPickImage={onPickImage}
          onRemoveImage={onRemoveImage}
          scopeChips={scopeChips}
          scopeSelected={scopeSelected}
          onToggleScope={onToggleScope}
        />

        {deskTab === 'products' ? (
          <ProductsCanvas
            cart={cart}
            addToCart={addToCart}
            categories={categories}
            hasResult={hasResult}
            onAddCategory={onAddCategory}
            onPreviewCategory={onPreviewCategory}
          />
        ) : (
          <DesignPreviewCanvas
            deskTab={deskTab}
            rendering={rendering}
            image={canvasImage}
            pins={pins}
            originalImage={originalImage}
            activeVersion={activeVersion}
            hasVersions={versions.length > 0}
          />
        )}

        <PreviewHistoryPanel versions={versions} active={activeVersion} onSelect={setActiveVersion} onRender={onRender} busy={busy} />
      </div>
    </div>
  );
}
