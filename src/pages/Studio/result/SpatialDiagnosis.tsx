/**
 * SpatialDiagnosis — Decision Dashboard (Teaser Mode)
 *
 * Adapted from Homastudio01 design. UX principles:
 *   - NO score ring (removed for clarity — budget is the hero number)
 *   - Benefit-oriented headline + budget estimate
 *   - Improvement points with descriptive category icons
 *   - Flowing diagnosis text (not collapsed)
 *   - Trust metadata (collapsed)
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Sofa,
  Lamp,
  Palette,
  LayoutGrid,
  TrendingUp,
  Ruler,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { RedesignSession } from '@/services/studioService';

// ---------------------------------------------------------------------------
// Icon utilities (from DiagnosisActionCard pattern)
// ---------------------------------------------------------------------------

type IconType = 'furniture' | 'lighting' | 'boundary' | 'color' | 'growth' | 'proportion' | 'default';

const ICON_MAP: Record<IconType, LucideIcon> = {
  furniture: Sofa,
  lighting: Lamp,
  boundary: LayoutGrid,
  color: Palette,
  growth: TrendingUp,
  proportion: Ruler,
  default: Sparkles,
};

/**
 * Guess an icon category from the Persian improvement point text.
 * Simple keyword matching — not perfect, but gives visual variety.
 */
function guessIconType(text: string): IconType {
  const lower = text.toLowerCase();
  if (/نور|لامپ|روشنایی|آباژور|چراغ|led/i.test(lower)) return 'lighting';
  if (/فرش|کف|مرز|حاشیه|لایه/i.test(lower)) return 'boundary';
  if (/رنگ|پالت|تعادل رنگ|تنالیته|کنتراست/i.test(lower)) return 'color';
  if (/مبل|کاناپه|صندلی|چینش|جابجا/i.test(lower)) return 'furniture';
  if (/رشد|پتانسیل|ارتقا|بلند|عمودی|گیاه/i.test(lower)) return 'growth';
  if (/اندازه|تناسب|ابعاد|فاصله/i.test(lower)) return 'proportion';
  return 'default';
}

/**
 * Extract a short title from an improvement point string.
 * Takes the first phrase (before dash, comma, or parentheses) as the title.
 */
function extractTitleAndDetail(text: string): { title: string; detail: string } {
  // Try common Persian separators
  const separators = [' — ', ' - ', '؛ ', ': ', '، '];
  for (const sep of separators) {
    const idx = text.indexOf(sep);
    if (idx > 0 && idx < 40) {
      return {
        title: text.slice(0, idx).trim(),
        detail: text.slice(idx + sep.length).trim(),
      };
    }
  }
  // If text is short enough, use it all as title
  if (text.length <= 40) {
    return { title: text, detail: '' };
  }
  // Fallback: first ~30 chars as title
  const spaceIdx = text.indexOf(' ', 25);
  if (spaceIdx > 0) {
    return { title: text.slice(0, spaceIdx), detail: text.slice(spaceIdx + 1) };
  }
  return { title: text, detail: '' };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SpatialDiagnosisProps {
  diagnosis: RedesignSession['diagnosis'];
  diagnosisExpanded: boolean;
  onToggleDiagnosis: () => void;
  /** Total price of all items (Rial) */
  totalPrice: number;
  /** Price of currently selected/accepted items (Rial) */
  selectedPrice: number;
  /** Number of actionable items */
  actionCount: number;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SpatialDiagnosis({
  diagnosis,
  diagnosisExpanded,
  onToggleDiagnosis,
  totalPrice,
  selectedPrice,
  actionCount,
}: SpatialDiagnosisProps) {
  const { t } = useTranslation();

  if (!diagnosis) return null;

  const { harmonyScore, improvementPoints, diagnosisDetail } = diagnosis;

  const displayPrice = selectedPrice > 0 ? selectedPrice : totalPrice;

  // Parse improvement points into structured items with icons
  const structuredPoints = useMemo(
    () =>
      improvementPoints.map((point, idx) => {
        const iconType = guessIconType(point);
        const { title, detail } = extractTitleAndDetail(point);
        return { id: idx, iconType, title, detail, fullText: point };
      }),
    [improvementPoints],
  );

  return (
    <section
      aria-label={t('studio.result.v2.diagnosis.label', 'تحلیل فضا')}
      className="w-full"
      style={{
        paddingTop: 'var(--spacing-sm, 8px)',
        paddingBottom: 'var(--spacing-md, 16px)',
      }}
    >
      {/* ═══ Benefit headline ═══ */}
      <div style={{ marginBottom: 'var(--spacing-lg, 24px)' }}>
        {/* Headline */}
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 400,
            color: 'var(--color-editorial-charcoal)',
            lineHeight: 1.5,
            marginBottom: 'var(--spacing-sm, 8px)',
            margin: 0,
          }}
        >
          {harmonyScore >= 75
            ? t('studio.result.v2.diagnosis.headlineGood', 'با چند تغییر هدفمند، فضا کامل‌تر می‌شه')
            : t('studio.result.v2.diagnosis.headlineFair', 'فضای شما پتانسیل بالایی داره')}
        </h1>

        {/* Budget estimate */}
        {displayPrice > 0 && (
          <div
            className="flex items-baseline flex-wrap"
            style={{ gap: '6px', marginTop: 'var(--spacing-sm, 8px)', marginBottom: 'var(--spacing-sm, 8px)' }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: 'var(--color-editorial-taupe)',
                lineHeight: 1,
              }}
            >
              {t('studio.result.v2.diagnosis.budgetLabel', 'تخمین بودجه برای')} {toLocalizedDigits(actionCount)} {t('studio.result.v2.diagnosis.budgetActions', 'اقدام')}:
            </span>
            <span
              className="tabular-nums"
              style={{
                fontSize: 'var(--text-h2-size, 24px)',
                fontWeight: 700,
                color: 'var(--color-editorial-charcoal)',
                lineHeight: 1,
                transition: 'all 0.3s ease',
              }}
            >
              {formatPriceFromRial(displayPrice, false)}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 400,
                color: 'var(--color-editorial-taupe)',
                lineHeight: 1,
              }}
            >
              {t('common.toman', 'تومان')}
            </span>
          </div>
        )}

        {/* Diagnosis detail text — flowing paragraph */}
        <p
          style={{
            fontSize: 'var(--text-caption-size, 12px)',
            fontWeight: 400,
            color: 'var(--color-editorial-taupe)',
            lineHeight: 1.7,
            margin: 0,
            marginTop: 'var(--spacing-xs, 4px)',
          }}
        >
          {diagnosisDetail ||
            t('studio.result.v2.diagnosis.defaultDetail', 'بر اساس تحلیل فضای شما، مهم‌ترین فرصت‌های بهبود رو شناسایی کردیم.')}
        </p>
      </div>

      {/* ═══ Improvement points with category icons ═══ */}
      {structuredPoints.length > 0 && (
        <div
          className="flex flex-col"
          style={{ gap: 0, marginBottom: 'var(--spacing-lg, 24px)' }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-editorial-taupe)',
              letterSpacing: '0.06em',
              marginBottom: 'var(--spacing-sm, 8px)',
            }}
          >
            {t('studio.result.v2.diagnosis.improvementTitle', 'فرصت‌های بهبود')}
          </span>

          {structuredPoints.map((item, idx) => {
            const IconComponent = ICON_MAP[item.iconType] || Sparkles;

            return (
              <div
                key={item.id}
                className="flex items-start"
                style={{
                  padding: '14px 0',
                  borderBottom:
                    idx < structuredPoints.length - 1
                      ? '1px solid var(--color-editorial-hairline)'
                      : 'none',
                  gap: '12px',
                }}
              >
                {/* Category icon in circle */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--color-editorial-stone, #FAF9F6)',
                    marginTop: '1px',
                  }}
                >
                  <IconComponent
                    size={14}
                    strokeWidth={1.5}
                    style={{
                      color: 'var(--color-editorial-charcoal)',
                      opacity: 0.75,
                    }}
                  />
                </div>

                {/* Title + detail */}
                <div className="flex flex-col flex-1 min-w-0" style={{ gap: '4px' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-caption-size, 12px)',
                      fontWeight: 600,
                      color: 'var(--color-editorial-charcoal)',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.title}
                  </span>

                  {item.detail && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 400,
                        color: 'var(--color-editorial-taupe)',
                        lineHeight: 1.7,
                      }}
                    >
                      {item.detail}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Expandable trust/detail section ═══ */}
      {diagnosisDetail && (
        <div style={{ marginTop: 'var(--spacing-xs, 4px)' }}>
          <button
            onClick={onToggleDiagnosis}
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{
              padding: '4px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-expanded={diagnosisExpanded}
            aria-label={
              diagnosisExpanded
                ? t('studio.result.v2.diagnosis.collapse', 'بستن جزئیات')
                : t('studio.result.v2.diagnosis.expand', 'جزئیات تشخیصی')
            }
          >
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-editorial-taupe)',
              }}
            >
              {t('studio.result.v2.diagnosis.detailToggle', 'جزئیات تشخیصی')}
            </span>
            <ChevronDown
              size={11}
              strokeWidth={1.5}
              className="transition-transform duration-300"
              style={{
                color: 'var(--color-editorial-taupe)',
                opacity: 0.4,
                transform: diagnosisExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          <AnimatePresence initial={false}>
            {diagnosisExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p
                  style={{
                    paddingTop: 'var(--spacing-sm, 8px)',
                    fontSize: 'var(--text-caption-size, 12px)',
                    color: 'var(--color-editorial-charcoal)',
                    lineHeight: 1.8,
                    margin: 0,
                  }}
                >
                  {diagnosisDetail}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
