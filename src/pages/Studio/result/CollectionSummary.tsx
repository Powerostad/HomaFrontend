/**
 * CollectionSummary — Commit Bar (Floating Glass Capsule)
 *
 * Navigation bar + live price indicator:
 *   - In analysis phase: 3 navigation tabs only
 *   - In recommendations / basket phase: 3 navigation tabs + live total price
 *
 * The "ادامه به پرداخت" CTA lives inside InvoiceSummary,
 * keeping this dock compact and consistent across phases.
 *
 * Uses CSS transitions for tab pill indicator.
 * Uses design tokens from globals.css throughout.
 */
import { useState, useEffect } from 'react';
import { formatPriceFromRial } from '@/utils/formatters';

type Phase = 'analysis' | 'recommendations' | 'basket';

interface CollectionSummaryProps {
  activePhase?: Phase;
  onNavigateToPhase?: (phase: Phase) => void;
  selectedCount: number;
  totalRecommendations: number;
  onFinalize?: () => void;
  selectedPrice?: number;
  totalCount?: number;
  totalPrice?: number;
  harmonyScore?: number;
  projectedScore?: number;
  liveProjectedScore?: number;
}

export function CollectionSummary({
  activePhase = 'analysis',
  selectedPrice = 0,
  onNavigateToPhase,
}: CollectionSummaryProps) {
  /* Tabs defined inside function body to guarantee availability */
  const tabs: { id: Phase; label: string }[] = [
    { id: 'analysis', label: 'تحلیل فضا' },
    { id: 'recommendations', label: 'محصولات' },
    { id: 'basket', label: 'سبد' },
  ];

  const hasPrice = selectedPrice > 0;
  const isAnalysisPhase = activePhase === 'analysis';

  /* Hide when bottom sheet is open */
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setHidden(detail.open);
    };
    window.addEventListener('homa:sheet-toggle', handler);
    return () => window.removeEventListener('homa:sheet-toggle', handler);
  }, []);

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{
        paddingBottom: 'max(var(--spacing-xs), env(safe-area-inset-bottom, var(--spacing-xs)))',
        paddingLeft: 'var(--spacing-sm)',
        paddingRight: 'var(--spacing-sm)',
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(20px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: hidden ? 'none' : undefined,
      }}
    >
      <div
        className="pointer-events-auto flex items-center"
        style={{
          fontFamily: 'var(--font-family-vazirmatn)',
          background: 'var(--glass-light)',
          backdropFilter: 'blur(var(--blur-lg))',
          WebkitBackdropFilter: 'blur(var(--blur-lg))',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '2px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {/* Navigation tabs */}
        <nav
          aria-label="مراحل طراحی"
          className="flex items-center relative"
          style={{ gap: '2px' }}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activePhase;

            return (
              <button
                key={tab.id}
                onClick={() => onNavigateToPhase?.(tab.id)}
                className="relative flex items-center justify-center transition-all duration-200"
                style={{
                  padding: '8px 14px',
                  background: isActive ? 'var(--surface)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'var(--elevation-sm)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  style={{
                    fontSize: 'var(--text-caption-size)',
                    fontWeight: isActive
                      ? 'var(--font-weight-semibold)'
                      : 'var(--font-weight-regular)',
                    fontFamily: 'var(--font-family-vazirmatn)',
                    color: isActive
                      ? 'var(--editorial-charcoal)'
                      : 'var(--editorial-taupe)',
                    transition: 'color 0.25s ease, font-weight 0.25s ease',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Divider + Price */}
        {!isAnalysisPhase && hasPrice ? (
          <div className="flex items-center">
            {/* Vertical divider */}
            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--editorial-hairline)',
                marginLeft: '4px',
                marginRight: '4px',
                flexShrink: 0,
              }}
            />

            {/* Live total price */}
            <span
              className="tabular-nums"
              dir="ltr"
              style={{
                fontSize: 'var(--text-caption-size)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-vazirmatn)',
                color: 'var(--editorial-charcoal)',
                letterSpacing: '0.02em',
                paddingLeft: '6px',
                paddingRight: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {formatPriceFromRial(selectedPrice, true)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
