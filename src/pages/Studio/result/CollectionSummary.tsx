import { useSiteTranslation } from '@/i18n/siteCopy';
import { formatPriceFromRial, toLocalizedDigits } from '@/utils/formatters';
import { LayoutGrid, MessageSquare, ShoppingBag, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Phase = 'analysis' | 'recommendations' | 'basket';

interface CollectionSummaryProps {
  activePhase?: Phase;
  onNavigateToPhase?: (phase: Phase) => void;
  selectedCount: number;
  totalRecommendations: number;
  selectedPrice?: number;
  totalCount?: number;
  isAtBasket?: boolean;
  onOpenChat?: () => void;
  chatOpen?: boolean;
}

export function CollectionSummary({
  activePhase = 'analysis',
  onNavigateToPhase,
  selectedCount,
  totalRecommendations,
  selectedPrice = 0,
  isAtBasket = false,
  onOpenChat,
  chatOpen = false,
}: CollectionSummaryProps) {
  const { siteValue } = useSiteTranslation();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const summaryRef = useRef<HTMLElement>(null);
  const tabs = [
    { id: 'analysis' as const, icon: LayoutGrid, label: t('studio.result.v2.phase.analysis', 'تحلیل فضا') },
    { id: 'recommendations' as const, icon: Sparkles, label: t('studio.result.v2.phase.recommendations', 'پیشنهادها') },
    { id: 'basket' as const, icon: ShoppingBag, label: t('studio.result.v2.phase.basket', 'سبد خرید') },
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
      const height = summary.getBoundingClientRect().height;
      if (height > 0) document.documentElement.style.setProperty('--studio-summary-height', `${height}px`);
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
      className={`studio-summary ${isAtBasket ? 'is-inline' : ''} ${sheetOpen || chatOpen ? 'is-hidden' : ''} ${onOpenChat ? 'studio-summary-with-chat' : ''}`}
      hidden={chatOpen}
      aria-label={t('studio.result.v2.summary.label', 'خلاصه انتخاب‌ها')}
    >
      <div className="studio-summary-inner">
        <nav className="studio-summary-nav" aria-label={t('studio.result.v2.phase.label', 'مراحل نتیجه')}>
          {onOpenChat && <button type="button" onClick={onOpenChat}><MessageSquare size={16} aria-hidden="true" />{t('studioWorkspace.conversation')}</button>}
          {siteValue(tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => onNavigateToPhase?.(tab.id)}
              aria-current={tab.id === activePhase ? 'step' : undefined}
              className={tab.id === activePhase ? 'is-active' : ''}
            >
              <tab.icon size={21} aria-hidden="true" />{siteValue(tab.label)}
            </button>
          )))}
        </nav>

        <div className="studio-summary-info">
          <div className="studio-summary-count">
            <ShoppingBag size={17} />
            <span>{siteValue(toLocalizedDigits(selectedCount))} {t('studio.result.v2.summary.selectedProducts', 'محصول انتخاب شده')}</span>
            <small>{t('studio.result.v2.summary.ofRecommendations', 'از {{count}} پیشنهاد', { count: totalRecommendations })}</small>
          </div>
          <span className="studio-summary-price" dir="ltr">{selectedCount === 0 ? `${toLocalizedDigits(0)} ${t('common.toman')}` : siteValue(formatPriceFromRial(selectedPrice, true))}</span>
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
