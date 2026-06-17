/**
 * Product / suggestion rendering for the Room Redesign flow (Studio editorial skin):
 *  - ImpactRow          (ranked change: square rank badge, title, impact bars, cost)
 *  - ProductCard        (sharp card: product-bg image, name, quiet price, افزودن CTA)
 *  - ProductCarousel    (horizontal scroller of ProductCards)
 *  - SelectedProductCard / SelectedCarousel (Phase 3 carousel + basket rows)
 */
import { Heart, X, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { formatPriceFromRial, toPersianDigits } from '@/utils/formatters';
import { RD } from '../theme';
import type { CostLevel, ImpactItem, RedesignProduct } from '../types';

const TAP = { scale: 0.94 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

const COST_META: Record<CostLevel, { label: string; color: string }> = {
  low: { label: 'کم', color: RD.inkSoft },
  medium: { label: 'متوسط', color: RD.warning },
  high: { label: 'زیاد', color: RD.danger },
};

function ImpactBars({ value }: { value: number }) {
  const heights = [5, 7, 9, 11, 13];
  return (
    <span className="flex items-end gap-[2px] h-3.5">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[4px] rounded-full"
          style={{ height: h, backgroundColor: i < value ? RD.greenMid : '#D8DAD3' }}
        />
      ))}
    </span>
  );
}

export function ImpactRow({ item }: { item: ImpactItem }) {
  const cost = COST_META[item.cost];
  return (
    <div className="flex items-center justify-between py-3.5" style={{ fontFamily: 'Vazirmatn' }}>
      {/* Right (title) */}
      <div className="flex items-center gap-2.5">
        <span
          className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[12px] font-black text-white shrink-0"
          style={{ backgroundColor: RD.greenDeep }}
        >
          {toPersianDigits(item.rank)}
        </span>
        <span className="text-[15px] font-bold" style={{ color: RD.ink }}>
          {item.title}
        </span>
      </div>

      {/* Left (metrics) */}
      <div className="flex items-center gap-3.5 shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: RD.inkMuted }}>تأثیر</span>
          <ImpactBars value={item.impact} />
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: RD.inkMuted }}>هزینه</span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cost.color }} />
          <span className="text-[11.5px] font-medium" style={{ color: cost.color }}>{cost.label}</span>
        </span>
      </div>
    </div>
  );
}

// ── ProductCard (vertical, sharp editorial) ─────────────────────────
export function ProductCard({ product, onAdd }: { product: RedesignProduct; onAdd?: () => void }) {
  return (
    <div
      className="w-[140px] shrink-0 overflow-hidden"
      style={{ backgroundColor: RD.card, border: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}
    >
      <div className="relative w-full aspect-[4/5]" style={{ backgroundColor: 'var(--editorial-product-bg)' }}>
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover mix-blend-multiply"
        />
        <button
          type="button"
          aria-label="پسندیدن"
          className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center active:scale-90 transition"
          style={{ background: 'transparent', border: `1px solid ${RD.line}`, color: RD.ink }}
        >
          <Heart size={14} strokeWidth={2} />
        </button>
      </div>
      <div className="pt-2 px-2.5 pb-2.5">
        <h4 className="text-[13px] font-semibold leading-tight line-clamp-1" style={{ color: RD.ink }}>
          {product.name}
        </h4>
        <p className="text-[11px] mt-0.5" style={{ color: RD.inkMuted }}>{product.subtitle}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-baseline gap-1">
            <span className="text-[14px] font-normal tabular-nums" style={{ color: RD.inkSoft }}>
              {formatPriceFromRial(product.priceRial, false)}
            </span>
            <span className="text-[11px]" style={{ color: RD.inkMuted }}>تومان</span>
          </span>
          <motion.button
            type="button"
            aria-label="افزودن به سبد"
            onClick={onAdd}
            whileTap={TAP}
            transition={SPRING}
            className="flex items-center justify-center shrink-0"
            style={{
              height: '32px',
              padding: '0 12px',
              backgroundColor: RD.green,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'Vazirmatn',
            }}
          >
            افزودن
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export function ProductCarousel({ products, onAdd }: { products: RedesignProduct[]; onAdd?: (p: RedesignProduct) => void }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={() => onAdd?.(p)} />
      ))}
    </div>
  );
}

// ── SelectedProductCard (carousel card OR full-width basket row) ─────
export function SelectedProductCard({
  product,
  variant = 'card',
  onRemove,
}: {
  product: RedesignProduct;
  variant?: 'card' | 'row';
  onRemove?: () => void;
}) {
  const isRow = variant === 'row';
  return (
    <div
      className={`flex items-center gap-2.5 p-2 shrink-0 ${isRow ? 'w-full' : 'w-[168px]'}`}
      style={{ backgroundColor: '#fff', border: `1px solid ${RD.line}`, fontFamily: 'Vazirmatn' }}
    >
      <motion.button
        type="button"
        aria-label={isRow ? 'حذف از سبد' : 'افزودن به سبد'}
        onClick={onRemove}
        whileTap={{ scale: 0.92 }}
        transition={SPRING}
        className="w-9 h-9 flex items-center justify-center shrink-0 order-first"
        style={{ background: 'transparent', border: `1px solid ${RD.line}`, color: RD.ink }}
      >
        {isRow ? <X size={15} strokeWidth={1.75} /> : <ShoppingBag size={15} strokeWidth={1.75} />}
      </motion.button>
      <div className="flex-1 min-w-0 text-right">
        <h4 className="text-[12.5px] font-semibold leading-tight line-clamp-1" style={{ color: RD.ink }}>
          {product.name}
        </h4>
        <span className="flex items-baseline gap-1 justify-start mt-1">
          <span className="text-[12px] font-normal tabular-nums" style={{ color: RD.inkSoft }}>
            {formatPriceFromRial(product.priceRial, false)}
          </span>
          <span className="text-[9.5px]" style={{ color: RD.inkMuted }}>تومان</span>
        </span>
      </div>
      <div className="w-16 h-16 overflow-hidden shrink-0" style={{ backgroundColor: 'var(--editorial-product-bg)' }}>
        <ImageWithFallback src={product.imageUrl} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
      </div>
    </div>
  );
}

export function SelectedCarousel({ products }: { products: RedesignProduct[] }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
      {products.map((p) => (
        <SelectedProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
