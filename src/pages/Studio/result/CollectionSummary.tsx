import { useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';

type Phase = 'analysis' | 'recommendations' | 'basket';

interface CollectionSummaryProps {
  activePhase?: Phase;
  onNavigateToPhase?: (phase: Phase) => void;
  selectedCount: number;
  totalRecommendations: number;
  selectedPrice?: number;
  totalCount?: number;
  isAtBasket?: boolean;
}

export function CollectionSummary({
  activePhase = 'analysis',
  onNavigateToPhase,
  selectedCount,
  totalRecommendations,
  selectedPrice = 0,
  isAtBasket = false,
}: CollectionSummaryProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const summaryRef = useRef<HTMLElement>(null);
  const tabs: { id: Phase; label: string }[] = [
    { id: 'analysis', label: t('studio.result.v2.phase.analysis', 'تحلیل فضا') },
    { id: 'recommendations', label: t('studio.result.v2.phase.recommendations', 'پیشنهادها') },
    { id: 'basket', label: t('studio.result.v2.phase.basket', 'سبد خرید') },
  ];

  useEffect(() => {
    const handleSheetToggle = (event: Event) => {
      setSheetOpen((event as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener('homa:sheet-toggle', handleSheetToggle);
    return () => window.removeEventListener('homa:sheet-toggle', handleSheetToggle);
  }, []);

  useEffect(() => {
    const summary = summaryRef.current;
    if (!summary || typeof ResizeObserver === 'undefined') return;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--studio-summary-height', `${summary.getBoundingClientRect().height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(summary);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--studio-summary-height');
    };
  }, []);

  return (
    <aside
      ref={summaryRef}
      className={`studio-summary ${isAtBasket ? 'is-inline' : ''} ${sheetOpen ? 'is-hidden' : ''}`}
      aria-label={t('studio.result.v2.summary.label', 'خلاصه انتخاب‌ها')}
    >
      <div className="studio-summary-inner">
        <nav className="studio-summary-nav" aria-label={t('studio.result.v2.phase.label', 'مراحل نتیجه')}>
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => onNavigateToPhase?.(tab.id)}
              aria-current={tab.id === activePhase ? 'step' : undefined}
              className={tab.id === activePhase ? 'is-active' : ''}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="studio-summary-info">
          <div className="studio-summary-count">
            <ShoppingBag size={17} />
            <span>{toLocalizedDigits(selectedCount)} {t('studio.result.v2.summary.selectedProducts', 'محصول انتخاب شده')}</span>
            <small>{t('studio.result.v2.summary.ofRecommendations', 'از {{count}} پیشنهاد', { count: totalRecommendations })}</small>
          </div>
          <span className="studio-summary-price" dir="ltr">{formatPriceFromRial(selectedPrice, true)}</span>
          <button
            type="button"
            className="studio-summary-cta"
            onClick={() => onNavigateToPhase?.('basket')}
          >
            {t('studio.result.v2.summary.viewBasket', 'مشاهده سبد')}
          </button>
        </div>
      </div>
    </aside>
  );
}
