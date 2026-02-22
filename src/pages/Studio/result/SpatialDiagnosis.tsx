/**
 * SpatialDiagnosis — Decision Dashboard (Teaser Mode)
 *
 * UX principles applied:
 *   ✅ NO per-issue CTA buttons (eliminates ping-pong / click fatigue)
 *   ✅ NO warning triangles (replaced with descriptive category icons)
 *   ✅ NO abstract +80 impact badges (removes confusing gamification)
 *   ✅ Reads as a flowing, inspiring narrative — builds desire
 *   ✅ Budget-only card — score removed for clarity
 *
 * Structure (above fold):
 *   1. Benefit-oriented headline + short detail + inline budget estimate
 *   2. Issues list with descriptive icons — pure reading flow
 *   3. Trust metadata (collapsed)
 *
 * All styling from CSS variables. Fonts: Vazirmatn + Serif.
 */

import { useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import { type DiagnosisAction, getDescriptiveIcon } from './DiagnosisActionCard';

const FONT = 'var(--font-family-vazirmatn)';

/* ── Public Types ── */
export interface DetectedContext {
  roomType: string;
  targetStyle: string;
  naturalLight: string;
  dominantSurfaces: string;
}

interface SpatialDiagnosisProps {
  harmonyScore: number;
  projectedScore: number;
  totalPrice: number;
  selectedPrice: number;
  selectedCount: number;
  diagnosisDetail: string;
  diagnosisExpanded: boolean;
  onToggleDiagnosis: () => void;
  detectedContext?: DetectedContext;
  diagnosisActions?: DiagnosisAction[];
  onScrollToStep?: (itemId: number) => void;
  onNavigateToRecommendations?: () => void;
}

/* ── Icon color per category — warm, editorial, non-threatening ── */
function getIconColor(status: string): string {
  switch (status) {
    case 'good':
      return 'var(--feedback-good)';
    case 'critical':
      return 'var(--accent)';
    default:
      // All warning-level items get a warm editorial charcoal — no alarming colors
      return 'var(--editorial-charcoal)';
  }
}

/* ═══════════════════════════════════════════════
   Main Component — Decision Dashboard
   ═══════════════════════════════════════════════ */
export function SpatialDiagnosis({
  harmonyScore,
  totalPrice,
  selectedPrice,
  diagnosisDetail,
  detectedContext,
  diagnosisActions = [],
}: SpatialDiagnosisProps) {
  const [trustOpen, setTrustOpen] = useState(false);

  /* Split actions: issues vs good */
  const issues = diagnosisActions.filter((a) => a.status !== 'good');
  const goods = diagnosisActions.filter((a) => a.status === 'good');

  /* Use selectedPrice for display — matches the bottom bar for consistency */
  const displayPrice = selectedPrice > 0 ? selectedPrice : totalPrice;
  const purchasableCount = issues.length;

  /* Issues sorted by priority (critical first, then warning) */
  const sortedIssues = [...issues].sort((a, b) => {
    const order = { critical: 0, warning: 1, good: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  return (
    <section
      aria-label="تحلیل فضا"
      className="w-full"
      style={{
        fontFamily: FONT,
        paddingTop: 'var(--spacing-sm)',
        paddingBottom: 'var(--spacing-md)',
      }}
    >
      {/* ═══ Benefit headline + budget estimate + detail ═══ */}
      <div
        style={{ marginBottom: 'var(--spacing-lg)' }}
      >
        {/* 1. Title */}
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 'var(--font-weight-regular)',
            fontFamily: FONT,
            color: 'var(--editorial-charcoal)',
            lineHeight: 1.5,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          {harmonyScore >= 75
            ? 'با چند تغییر هدفمند، فضا کامل‌تر می‌شه'
            : 'فضای شما پتانسیل بالایی داره'}
        </h1>

        {/* 2. Budget estimate — right after title */}
        <div className="flex items-baseline flex-wrap" style={{ gap: '6px', marginBottom: 'var(--spacing-sm)' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              lineHeight: 1,
            }}
          >
            تخمین بودجه برای {toLocalizedDigits(purchasableCount)} اقدام:
          </span>
          <span
            className="tabular-nums"
            style={{
              fontSize: 'var(--text-h2-size)',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: FONT,
              color: 'var(--editorial-charcoal)',
              lineHeight: 1,
              transition: 'all 0.3s ease',
            }}
          >
            {formatPriceFromRial(displayPrice, false)}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              lineHeight: 1,
            }}
          >
            تومان
          </span>
        </div>

        {/* 3. Analytical detail text */}
        <p
          style={{
            fontSize: 'var(--text-caption-size)',
            fontWeight: 'var(--font-weight-regular)',
            fontFamily: FONT,
            color: 'var(--editorial-taupe)',
            lineHeight: 1.7,
          }}
        >
          {diagnosisDetail ||
            'بر اساس تحلیل فضای شما، مهم‌ترین فرصت‌های بهبود رو شناسایی کردیم.'}
        </p>
      </div>

      {/* ═══ Issues list — pure reading flow, no CTAs ═══ */}
      {sortedIssues.length > 0 && (
        <div
          className="flex flex-col"
          style={{ gap: '0', marginBottom: 'var(--spacing-lg)' }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
              letterSpacing: '0.06em',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            فرصت‌های بهبود
          </span>

          {sortedIssues.map((issue, idx) => {
            const IconComponent = getDescriptiveIcon(issue.status, issue.iconType);
            const iconColor = getIconColor(issue.status);

            return (
              <div
                key={issue.id}
                className="flex items-start"
                style={{
                  padding: '14px 0',
                  borderBottom:
                    idx < sortedIssues.length - 1
                      ? '1px solid var(--editorial-hairline)'
                      : 'none',
                  gap: '12px',
                }}
              >
                {/* Descriptive category icon */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-full)',
                    background: issue.status === 'critical'
                      ? 'rgba(41, 128, 185, 0.06)'
                      : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  <IconComponent
                    size={14}
                    strokeWidth={1.5}
                    style={{ color: iconColor, opacity: 0.75 }}
                  />
                </div>

                {/* Content — diagnosis + solution, flowing text */}
                <div className="flex flex-col flex-1" style={{ gap: '4px', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 'var(--text-caption-size)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: FONT,
                      color: 'var(--editorial-charcoal)',
                      lineHeight: 1.5,
                    }}
                  >
                    {issue.title}
                  </span>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-regular)',
                      fontFamily: FONT,
                      color: 'var(--editorial-taupe)',
                      lineHeight: 1.7,
                    }}
                  >
                    {issue.solution || issue.diagnosis}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Good items (collapsed) ═══ */}
      {goods.length > 0 && (
        <div
          className="flex items-center"
          style={{ gap: '6px', marginBottom: 'var(--spacing-md)' }}
        >
          <CheckCircle2
            size={13}
            strokeWidth={1.5}
            style={{ color: 'var(--feedback-good)', opacity: 0.7 }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              fontFamily: FONT,
              color: 'var(--editorial-taupe)',
            }}
          >
            {goods.map((g) => g.title).join('، ')} — وضعیت خوبه
          </span>
        </div>
      )}

      {/* ═══ Trust metadata (collapsed) ═══ */}
      {detectedContext && (
        <div
          style={{ marginTop: 'var(--spacing-xs)' }}
        >
          <button
            onClick={() => setTrustOpen(!trustOpen)}
            className="flex items-center gap-1.5 transition-colors duration-200"
            style={{ padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label={trustOpen ? 'بستن جزئیات تشخیص' : 'جزئیات تشخیص'}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--editorial-taupe)',
                fontFamily: FONT,
              }}
            >
              جزئیات تشخیص
            </span>
            <ChevronDown
              size={11}
              className="transition-transform duration-300"
              style={{
                color: 'var(--editorial-taupe)',
                opacity: 0.4,
                transform: trustOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              strokeWidth={1.5}
            />
          </button>

          <div
            style={{
              height: trustOpen ? 'auto' : 0,
              overflow: 'hidden',
              opacity: trustOpen ? 1 : 0,
              transition: 'all 0.3s ease',
            }}
          >
             <div
                className="overflow-hidden"
              >
                <div
                  className="flex flex-wrap gap-2"
                  style={{ paddingTop: '10px', paddingBottom: '4px' }}
                >
                  {[
                    { label: 'فضا', value: detectedContext.roomType },
                    { label: 'سبک', value: detectedContext.targetStyle },
                    { label: 'نور طبیعی', value: detectedContext.naturalLight },
                    { label: 'سطوح', value: detectedContext.dominantSurfaces },
                  ].filter((item) => item.value).map((item) => (
                    <span
                      key={item.label}
                      className="flex items-center gap-1"
                      style={{
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--editorial-charcoal)',
                        fontFamily: FONT,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--muted)',
                      }}
                    >
                      <span style={{ color: 'var(--editorial-taupe)', fontSize: '10px' }}>
                        {item.label}:
                      </span>
                      {item.value}
                    </span>
                  ))}
                </div>
              </div>
          </div>
        </div>
      )}
    </section>
  );
}
