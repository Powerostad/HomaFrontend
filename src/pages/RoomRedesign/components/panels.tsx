/**
 * The conversational panels of the Room Redesign flow, each a self-contained
 * bottom-sheet (scrollable body + pinned footer):
 *   - AnalysisPanel    (تحلیل فضا · intake: photo analysis + starting questions)
 *   - PreviewPanel     (تحلیل فضا · review: generated preview + feedback loop)
 *   - SuggestionsPanel (محصولات: ranked changes + product carousel)
 *   - BasketPanel      (سبد: selected products + checkout)
 */
import type { ReactNode } from 'react';
import { Eye, ShoppingBag, ArrowLeft, ChevronLeft, Droplet, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { RD } from '../theme';
import { ChatBubble, ChipRow, MessageInput, HeaderBadge, ChatThread, inputPlaceholder } from './chat';
import { SelectedCarousel, SelectedProductCard } from './products';
import { CategoryPlan } from './categories';
import { formatPriceFromRial } from '@/utils/formatters';
import {
  SUGGESTION_SUMMARY,
  EMPTY_PRODUCTS_HINT,
  PREVIEW_MESSAGE,
  PREVIEW_QUICK_EDITS,
  PREVIEW_PRODUCTS,
  BASKET_COPY,
} from '../data/mockData';
import type { RedesignProduct, ChatMessage, ChipGroup, Chip } from '../types';
import type { RedesignCategory, RoomFinding } from '../services/transformers';
import { IntakeForm } from './IntakeForm';

const TAP = { scale: 0.97 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

// ── Shared building blocks ──────────────────────────────────────────
function PanelHeader({
  title,
  subtitle,
  left,
  right,
}: {
  title: string;
  subtitle: string;
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="relative flex items-center justify-center min-h-[44px] px-1">
      <div className="text-center px-12" style={{ fontFamily: 'Vazirmatn' }}>
        <h2 className="text-[20px] font-medium leading-tight" style={{ color: RD.ink }}>{title}</h2>
        <p className="text-[11.5px] mt-1 font-normal" style={{ color: RD.inkMuted }}>{subtitle}</p>
      </div>
      {right && <div className="absolute right-0">{right}</div>}
      {left && <div className="absolute left-0">{left}</div>}
    </div>
  );
}

function PrimaryButton({ children, icon, onClick, className = '' }: { children: ReactNode; icon?: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={TAP}
      transition={SPRING}
      className={`h-[52px] rounded-none flex items-center justify-center gap-2 text-white text-[14px] font-semibold ${className}`}
      style={{ backgroundColor: RD.green, fontFamily: 'Vazirmatn' }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

function OutlineButton({ children, icon, onClick, className = '' }: { children: ReactNode; icon?: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={SPRING}
      className={`h-[52px] rounded-none flex items-center justify-center gap-2 text-[14px] font-semibold ${className}`}
      style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}`, color: RD.ink, fontFamily: 'Vazirmatn' }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/**
 * Panel content shell. NOT independently scrollable — it flows inside the single
 * MobileSheet scroll container (avoids nested-scroll jitter). The footer sticks to
 * the viewport bottom so the input/CTA stays reachable while content scrolls.
 */
function PanelShell({ body, footer }: { body: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex flex-col" style={{ backgroundColor: RD.sheet }}>
      <div className="px-5 pb-3">{body}</div>
      {footer && (
        <div
          className="sticky bottom-0 z-20 px-5 pt-3"
          style={{
            backgroundColor: RD.sheet,
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            boxShadow: RD.footerShadow,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ── تحلیل فضا · INTAKE ──────────────────────────────────────────────
export function AnalysisPanel({
  messages,
  chipGroups,
  onSelectChip,
  busy,
  rendering,
  findings,
  showIntake,
  intakeImage,
  onPickImage,
  onRemoveImage,
  scopeChips,
  scopeSelected,
  onToggleScope,
  inputValue,
  onInputChange,
  onSend,
}: {
  messages: ChatMessage[];
  chipGroups: ChipGroup[];
  onSelectChip: (groupId: string, chipId: string) => void;
  busy: boolean;
  rendering: boolean;
  findings: RoomFinding[];
  showIntake: boolean;
  intakeImage: string | null;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  scopeChips: Chip[];
  scopeSelected: Set<string>;
  onToggleScope: (chipId: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <PanelShell
      body={
        <div className="space-y-4 pt-1">
          <PanelHeader title="بازطراحی هما" subtitle="تحلیل اختصاصی" right={<HeaderBadge icon={Droplet} />} />
          {showIntake ? (
            <IntakeForm
              image={intakeImage}
              onPickImage={onPickImage}
              onRemoveImage={onRemoveImage}
              scopeChips={scopeChips}
              scopeSelected={scopeSelected}
              onToggleScope={onToggleScope}
              variant="mobile"
            />
          ) : (
            <ChatThread
              messages={messages}
              chipGroups={chipGroups}
              onSelectChip={onSelectChip}
              busy={busy}
              rendering={rendering}
              findings={findings}
              chipLayout="scroll"
            />
          )}
        </div>
      }
      footer={
        <MessageInput
          placeholder={inputPlaceholder(busy, rendering)}
          value={inputValue}
          onChange={onInputChange}
          onSend={onSend}
          disabled={busy}
        />
      }
    />
  );
}

// ── پیشنهادها · guided shopping plan (grouped by design category) ────
export function SuggestionsPanel({
  categories,
  hasResult,
  summary,
  onPreview,
  onAddAll,
  onAdd,
  onAddCategory,
  onPreviewCategory,
}: {
  categories: RedesignCategory[];
  hasResult: boolean;
  summary?: string;
  onPreview: () => void;
  onAddAll: () => void;
  onAdd?: (p: RedesignProduct) => void;
  onAddCategory: (c: RedesignCategory) => void;
  onPreviewCategory?: (c: RedesignCategory) => void;
}) {
  if (!hasResult) {
    return (
      <PanelShell
        body={
          <div className="min-h-[45dvh] flex items-center justify-center text-center px-6" style={{ fontFamily: 'Vazirmatn' }}>
            <p className="text-[13px] leading-[1.8]" style={{ color: RD.inkSoft }}>{EMPTY_PRODUCTS_HINT}</p>
          </div>
        }
      />
    );
  }

  return (
    <PanelShell
      body={
        <div className="space-y-4 pt-1">
          <PanelHeader title="پیشنهادهای هما" subtitle="برنامهٔ خرید بر اساس اولویت" right={<HeaderBadge icon={Sparkles} />} />
          <div style={{ borderBottom: `1px solid ${RD.line}`, paddingBottom: '14px' }}>
            <p className="text-[13px] leading-[1.8]" style={{ color: RD.inkSoft, fontFamily: 'Vazirmatn' }}>
              {summary ?? SUGGESTION_SUMMARY}
            </p>
          </div>
          <CategoryPlan
            categories={categories}
            onAdd={(p) => onAdd?.(p)}
            onAddCategory={onAddCategory}
            onPreviewCategory={onPreviewCategory}
          />
        </div>
      }
      footer={
        <div className="flex gap-2.5">
          <OutlineButton className="flex-1" icon={<Eye size={16} strokeWidth={2} />} onClick={onPreview}>
            پیش‌نمایش این تغییرات
          </OutlineButton>
          <PrimaryButton className="flex-1" icon={<ShoppingBag size={16} strokeWidth={2} color="#fff" />} onClick={onAddAll}>
            افزودن همه به سبد
          </PrimaryButton>
        </div>
      }
    />
  );
}

// ── تحلیل فضا · REVIEW (preview + feedback) ─────────────────────────
function VersionNav({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-1.5" style={{ fontFamily: 'Vazirmatn' }}>
      <motion.button
        type="button"
        onClick={onNext}
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
        style={{ backgroundColor: RD.green }}
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        بعد
      </motion.button>
      <motion.button
        type="button"
        onClick={onPrev}
        whileTap={{ scale: 0.95 }}
        transition={SPRING}
        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}`, color: RD.inkSoft }}
      >
        قبل
      </motion.button>
    </div>
  );
}

export function PreviewPanel({
  inputValue,
  onInputChange,
  onSend,
  onContinue,
  onViewProducts,
  onPrevVersion,
  onNextVersion,
}: {
  inputValue: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onContinue: () => void;
  onViewProducts: () => void;
  onPrevVersion: () => void;
  onNextVersion: () => void;
}) {
  return (
    <PanelShell
      body={
        <div className="space-y-4 pt-1">
          <PanelHeader
            title="پیش‌نمایش و بازخورد"
            subtitle="این نسخه بر اساس انتخاب‌ها و بازخوردت ساخته شده."
            right={<VersionNav onPrev={onPrevVersion} onNext={onNextVersion} />}
          />
          <ChatBubble message={PREVIEW_MESSAGE} />
          <ChipRow group={PREVIEW_QUICK_EDITS} />
          <MessageInput placeholder="بازخوردت رو اینجا بنویس..." value={inputValue} onChange={onInputChange} onSend={onSend} />
          <div className="space-y-2">
            <h3 className="text-[13px] font-semibold text-right" style={{ color: RD.ink, fontFamily: 'Vazirmatn' }}>
              محصولات انتخاب‌شده در این نسخه
            </h3>
            <div className="flex items-center gap-1.5">
              <SelectedCarousel products={PREVIEW_PRODUCTS} />
              <span className="w-8 h-8 rounded-full bg-white shrink-0 flex items-center justify-center shadow-sm">
                <ChevronLeft size={15} strokeWidth={2} style={{ color: RD.inkSoft }} />
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex gap-2.5">
          <OutlineButton className="flex-1" onClick={onViewProducts}>
            دیدن محصولات این نسخه
          </OutlineButton>
          <PrimaryButton className="flex-1" onClick={onContinue}>
            ادامه ویرایش
          </PrimaryButton>
        </div>
      }
    />
  );
}

// ── سبد · basket ────────────────────────────────────────────────────
export function BasketPanel({
  items,
  onRemove,
  onCheckout,
  onGoProducts,
}: {
  items: RedesignProduct[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onGoProducts: () => void;
}) {
  const empty = items.length === 0;
  const total = items.reduce((s, p) => s + p.priceRial, 0);

  return (
    <PanelShell
      body={
        empty ? (
          <div className="min-h-[45dvh] flex flex-col items-center justify-center text-center gap-3 px-6" style={{ fontFamily: 'Vazirmatn' }}>
            <span className="w-16 h-16 rounded-none flex items-center justify-center" style={{ backgroundColor: RD.greenTintBg }}>
              <ShoppingCart size={30} strokeWidth={1.5} style={{ color: RD.greenMid }} />
            </span>
            <h2 className="text-[16px] font-bold" style={{ color: RD.ink }}>{BASKET_COPY.emptyHeadline}</h2>
            <p className="text-[13px] leading-[1.8] max-w-[230px]" style={{ color: RD.inkSoft }}>{BASKET_COPY.emptyBody}</p>
            <OutlineButton className="px-5 mt-1" icon={<ArrowLeft size={15} strokeWidth={2} />} onClick={onGoProducts}>
              {BASKET_COPY.emptyAction}
            </OutlineButton>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <PanelHeader title={BASKET_COPY.title} subtitle={BASKET_COPY.subtitle} right={<HeaderBadge icon={ShoppingCart} />} />
            <div className="space-y-2.5">
              {items.map((p) => (
                <SelectedProductCard key={p.id} product={p} variant="row" onRemove={() => onRemove(p.id)} />
              ))}
            </div>
            <div className="flex items-baseline justify-between pt-2" style={{ borderTop: `1px solid ${RD.lineSoft}`, fontFamily: 'Vazirmatn' }}>
              <span className="text-[11px]" style={{ color: RD.inkMuted }}>{BASKET_COPY.totalLabel}</span>
              <span className="flex items-baseline gap-1">
                <span className="text-[22px] font-bold tabular-nums" style={{ color: RD.ink }}>
                  {formatPriceFromRial(total, false)}
                </span>
                <span className="text-[11px]" style={{ color: RD.inkMuted }}>تومان</span>
              </span>
            </div>
          </div>
        )
      }
      footer={
        empty ? undefined : (
          <PrimaryButton className="w-full" icon={<ExternalLink size={16} strokeWidth={2} color="#fff" />} onClick={onCheckout}>
            {BASKET_COPY.checkoutCta}
          </PrimaryButton>
        )
      }
    />
  );
}
