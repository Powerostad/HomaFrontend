/**
 * SpatialDiagnosis -- Harmony score dashboard with diagnostic details
 *
 * Circular SVG score ring (0-100), improvement bullet points,
 * and an expandable diagnosis detail section (collapsed by default).
 * Editorial styling: stone background, charcoal text, hairline borders.
 * Only renders when diagnosis data exists (parent handles null check).
 */
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, CircleDot } from 'lucide-react';
import { toLocalizedDigits } from '@/utils/formatters';
import type { RedesignSession } from '@/services/studioService';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SpatialDiagnosisProps {
  diagnosis: RedesignSession['diagnosis'];
  diagnosisExpanded: boolean;
  onToggleDiagnosis: () => void;
}

// ---------------------------------------------------------------------------
// Circular score ring
// ---------------------------------------------------------------------------

function HarmonyRing({ score }: { score: number }) {
  const radius = 32;
  const stroke = 3;
  const size = 76;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const offset = circumference * (1 - progress);

  const ringColor =
    score >= 80
      ? 'var(--color-feedback-good)'
      : score >= 50
        ? 'var(--color-feedback-neutral)'
        : 'var(--color-feedback-bad)';

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-editorial-hairline)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span
        className="tabular-nums"
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-editorial-charcoal)',
          lineHeight: 1,
        }}
      >
        {toLocalizedDigits(score)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SpatialDiagnosis({
  diagnosis,
  diagnosisExpanded,
  onToggleDiagnosis,
}: SpatialDiagnosisProps) {
  const { t } = useTranslation();

  // Only render when diagnosis data exists
  if (!diagnosis) return null;

  const { harmonyScore, improvementPoints, diagnosisDetail } = diagnosis;

  return (
    <section
      aria-label={t('studio.result.v2.diagnosis.label', 'تحلیل فضا')}
      className="w-full"
      style={{
        paddingTop: 'var(--spacing-sm, 8px)',
        paddingBottom: 'var(--spacing-md, 16px)',
      }}
    >
      {/* ---- Score ring + headline ---- */}
      <div
        className="flex items-center gap-4"
        style={{ marginBottom: 'var(--spacing-md, 16px)' }}
      >
        <HarmonyRing score={harmonyScore} />

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h2
            style={{
              fontSize: 'var(--text-h3-size, 16px)',
              fontWeight: 600,
              color: 'var(--color-editorial-charcoal)',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            {harmonyScore >= 80
              ? t('studio.result.v2.diagnosis.good', 'هماهنگی خوب فضا')
              : harmonyScore >= 50
                ? t('studio.result.v2.diagnosis.fair', 'فضا پتانسیل بالایی داره')
                : t('studio.result.v2.diagnosis.low', 'فرصت‌های زیادی برای بهبود وجود داره')}
          </h2>
          <span
            style={{
              fontSize: 'var(--text-caption-size, 12px)',
              color: 'var(--color-editorial-taupe)',
              lineHeight: 1.5,
            }}
          >
            {t('studio.result.v2.diagnosis.scoreLabel', 'امتیاز هماهنگی')}
          </span>
        </div>
      </div>

      {/* ---- Improvement points ---- */}
      {improvementPoints.length > 0 && (
        <div
          className="flex flex-col"
          style={{ gap: 0, marginBottom: 'var(--spacing-md, 16px)' }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-editorial-taupe)',
              letterSpacing: '0.06em',
              marginBottom: 'var(--spacing-sm, 8px)',
            }}
          >
            {t('studio.result.v2.diagnosis.improvementTitle', 'فرصت‌های بهبود')}
          </span>

          {improvementPoints.map((point, idx) => (
            <div
              key={idx}
              className="flex items-start"
              style={{
                padding: '10px 0',
                borderBottom:
                  idx < improvementPoints.length - 1
                    ? '1px solid var(--color-editorial-hairline)'
                    : 'none',
                gap: 10,
              }}
            >
              <CircleDot
                size={14}
                strokeWidth={1.5}
                className="shrink-0"
                style={{
                  color: 'var(--color-editorial-taupe)',
                  marginTop: 2,
                  opacity: 0.6,
                }}
              />
              <span
                style={{
                  fontSize: 'var(--text-caption-size, 12px)',
                  color: 'var(--color-editorial-charcoal)',
                  lineHeight: 1.7,
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ---- Expandable diagnosis detail ---- */}
      {diagnosisDetail && (
        <div>
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
                : t('studio.result.v2.diagnosis.expand', 'جزئیات تشخیص')
            }
          >
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-editorial-taupe)',
              }}
            >
              {t('studio.result.v2.diagnosis.detailToggle', 'جزئیات تشخیص')}
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
