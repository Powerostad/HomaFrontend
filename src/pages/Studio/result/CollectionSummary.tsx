/**
 * CollectionSummary - Floating bottom dock with frosted glass
 *
 * Three-tab navigation: Analysis / Recommendations / Basket
 * Shows selected count and live price when not in analysis phase.
 * Active tab highlighted with editorial accent.
 *
 * RTL layout, i18n keys from studio.result.v2.phase.*
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import type { ResultPhase } from './useStudioResult';

interface CollectionSummaryProps {
  phase: ResultPhase;
  onNavigateToPhase: (phase: ResultPhase) => void;
  selectedCount: number;
  selectedPrice: number;
}

export function CollectionSummary({
  phase,
  onNavigateToPhase,
  selectedCount,
  selectedPrice,
}: CollectionSummaryProps) {
  const { t } = useTranslation();

  const tabs: { id: ResultPhase; label: string }[] = [
    { id: 'analysis', label: t('studio.result.v2.phase.analysis', 'تحلیل فضا') },
    { id: 'recommendations', label: t('studio.result.v2.phase.recommendations', 'محصولات') },
    { id: 'basket', label: t('studio.result.v2.phase.basket', 'سبد') },
  ];

  const hasPrice = selectedPrice > 0;
  const isAnalysisPhase = phase === 'analysis';

  // Hide when a bottom sheet is open
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
        <nav aria-label={t('studio.result.v2.phase.navLabel', 'مراحل طراحی')} className="flex items-center relative" style={{ gap: '2px' }}>
          {tabs.map((tab) => {
            const isActive = tab.id === phase;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigateToPhase(tab.id)}
                className="relative flex items-center justify-center transition-all duration-200"
                style={{
                  padding: '8px 14px',
                  background: isActive ? 'var(--surface-default)' : 'none',
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
                  className="text-caption"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--content-primary)' : 'var(--content-muted)',
                    transition: 'color 0.25s ease',
                  }}
                >
                  {tab.label}
                  {tab.id === 'basket' && selectedCount > 0 && (
                    <span
                      className="tabular-nums"
                      style={{
                        marginRight: '4px',
                        fontSize: '10px',
                        opacity: 0.7,
                      }}
                    >
                      ({toLocalizedDigits(selectedCount)})
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Divider + Price */}
        {!isAnalysisPhase && hasPrice && (
          <div className="flex items-center">
            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--border-subtle)',
                marginLeft: '4px',
                marginRight: '4px',
                flexShrink: 0,
              }}
            />
            <span
              className="tabular-nums"
              dir="ltr"
              style={{
                fontSize: 'var(--text-caption-size, 12px)',
                fontWeight: 600,
                color: 'var(--content-primary)',
                letterSpacing: '0.02em',
                paddingLeft: '6px',
                paddingRight: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              {formatPriceFromRial(selectedPrice, true)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
