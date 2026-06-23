/**
 * CategoryCard — the heart of the "guided shopping plan".
 *
 * One card per backend design-category item (فرش / پرده / …). Each card answers,
 * top to bottom: what change HOMA recommends (title + reason), how urgent
 * (priority badge), how much it helps / costs (impact + cost), which products
 * solve it (carousel), and lets the user add the whole category to the basket or
 * preview just this change. Shared by the mobile sheet and the desktop canvas.
 *
 * Pure presentation — all cart/preview behavior is delegated to callbacks so the
 * existing basket + render logic is untouched.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Grid3x3,
  Blinds,
  BedDouble,
  Lamp,
  Sparkles,
  Frame,
  Leaf,
  Sofa,
  Package,
  ShoppingBag,
  Eye,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { RD } from '../theme';
import { ImpactBars, ProductCarousel } from './products';
import type { CostLevel, RedesignProduct } from '../types';
import type { CategoryPriority, DesignCategoryKey, RedesignCategory } from '../services/transformers';
import { toPersianDigits } from '@/utils/formatters';

const TAP = { scale: 0.97 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

const CATEGORY_ICON: Record<DesignCategoryKey, LucideIcon> = {
  rug: Grid3x3,
  curtain: Blinds,
  bedding: BedDouble,
  lighting: Lamp,
  accessory: Sparkles,
  wall: Frame,
  plant: Leaf,
  furniture: Sofa,
  other: Package,
};

const PRIORITY_META: Record<CategoryPriority, { label: string; bg: string; fg: string }> = {
  essential: { label: 'ضروری', bg: RD.dangerBg, fg: RD.danger },
  recommended: { label: 'پیشنهادی', bg: RD.accentGreenBg, fg: RD.accentGreen },
  optional: { label: 'اختیاری', bg: RD.greenTintBg, fg: RD.inkSoft },
  next: { label: 'مرحله بعد', bg: RD.warningBg, fg: RD.warning },
};

const COST_META: Record<CostLevel, { label: string; color: string }> = {
  low: { label: 'هزینه کم', color: RD.inkSoft },
  medium: { label: 'هزینه متوسط', color: RD.warning },
  high: { label: 'هزینه زیاد', color: RD.danger },
};

function impactLabel(impact: number): string {
  if (impact >= 4) return 'تاثیر زیاد';
  if (impact >= 2) return 'تاثیر متوسط';
  return 'تاثیر کم';
}

// ── Badge / meta atoms ──────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: CategoryPriority }) {
  const m = PRIORITY_META[priority];
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

function MetaRow({ impact, cost }: { impact: number; cost: CostLevel | null }) {
  const c = cost ? COST_META[cost] : null;
  return (
    <div className="flex items-center gap-4" style={{ fontFamily: 'Vazirmatn' }}>
      <span className="flex items-center gap-1.5">
        <span className="text-[11px]" style={{ color: RD.inkMuted }}>{impactLabel(impact)}</span>
        <ImpactBars value={impact} />
      </span>
      {c && (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
          <span className="text-[11.5px] font-medium" style={{ color: c.color }}>{c.label}</span>
        </span>
      )}
    </div>
  );
}

// ── CategoryCard ────────────────────────────────────────────────────
export function CategoryCard({
  category,
  onAdd,
  onAddCategory,
  onPreviewCategory,
}: {
  category: RedesignCategory;
  onAdd: (p: RedesignProduct) => void;
  onAddCategory: (c: RedesignCategory) => void;
  onPreviewCategory?: (c: RedesignCategory) => void;
}) {
  const Icon = CATEGORY_ICON[category.key] ?? Package;
  const unavailable = category.unavailable;

  return (
    <section
      className="overflow-hidden"
      style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}`, borderRadius: 16, fontFamily: 'Vazirmatn' }}
      dir="rtl"
    >
      {/* Header: rank · icon · title · priority */}
      <div className="flex items-start gap-2.5 px-3.5 pt-3.5">
        <span
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: RD.greenTintBg }}
        >
          <Icon size={18} strokeWidth={1.9} style={{ color: RD.ink }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tabular-nums" style={{ color: RD.inkMuted }}>
              اولویت {toPersianDigits(category.rank)}
            </span>
            <h3 className="text-[15px] font-bold leading-tight truncate" style={{ color: RD.ink }}>
              {category.title}
            </h3>
          </div>
        </div>
        <PriorityBadge priority={category.priority} />
      </div>

      {/* Design reason */}
      {category.reason && (
        <p className="text-[12.5px] leading-[1.85] px-3.5 pt-2" style={{ color: RD.inkSoft }}>
          {category.reason}
        </p>
      )}

      {/* Impact + cost */}
      <div className="px-3.5 pt-2.5">
        <MetaRow impact={category.impact} cost={category.cost} />
      </div>

      {/* Products — or an unavailable note */}
      {unavailable ? (
        <div
          className="mx-3.5 mt-3 mb-1 rounded-xl px-3 py-3 text-[12px] leading-[1.8]"
          style={{ backgroundColor: RD.cream, border: `1px dashed ${RD.line}`, color: RD.inkSoft }}
        >
          {category.unavailableReason || 'فعلاً محصول مناسبی برای این تغییر پیدا نشد؛ بعداً دوباره بررسی می‌کنیم.'}
        </div>
      ) : (
        <div className="mt-3">
          <ProductCarousel products={category.products} onAdd={onAdd} />
        </div>
      )}

      {/* Actions */}
      {!unavailable && (
        <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-1">
          <motion.button
            type="button"
            onClick={() => onAddCategory(category)}
            whileTap={TAP}
            transition={SPRING}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl h-11 text-[13px] font-semibold"
            style={{ backgroundColor: RD.green, color: '#fff' }}
          >
            <ShoppingBag size={15} strokeWidth={2} />
            افزودن این دسته به سبد
          </motion.button>
          {onPreviewCategory && (
            <motion.button
              type="button"
              aria-label="پیش‌نمایش این تغییر"
              onClick={() => onPreviewCategory(category)}
              whileTap={TAP}
              transition={SPRING}
              className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl h-11 px-3.5 text-[13px] font-medium"
              style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}`, color: RD.ink }}
            >
              <Eye size={15} strokeWidth={2} />
              پیش‌نمایش
            </motion.button>
          )}
        </div>
      )}
    </section>
  );
}

// ── CategoryPlan: the ordered stack of category cards + a tiny legend ──
export function CategoryPlan({
  categories,
  onAdd,
  onAddCategory,
  onPreviewCategory,
}: {
  categories: RedesignCategory[];
  onAdd: (p: RedesignProduct) => void;
  onAddCategory: (c: RedesignCategory) => void;
  onPreviewCategory?: (c: RedesignCategory) => void;
}) {
  const available = categories.filter((c) => !c.unavailable).length;
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: RD.inkSoft, fontFamily: 'Vazirmatn' }}>
        <Check size={13} strokeWidth={2.5} style={{ color: RD.accentGreen }} />
        <span>
          {toPersianDigits(available)} دسته پیشنهادی، به ترتیب اولویت
        </span>
      </div>
      {categories.map((c) => (
        <CategoryCard
          key={c.id}
          category={c}
          onAdd={onAdd}
          onAddCategory={onAddCategory}
          onPreviewCategory={onPreviewCategory}
        />
      ))}
    </div>
  );
}
