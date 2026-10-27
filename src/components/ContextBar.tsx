import { useSiteTranslation } from '@/i18n/siteCopy';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { formatPriceFromRial } from '../utils/formatters';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContextBarProps {
  items: BreadcrumbItem[];
  price?: number;
}

export function ContextBar({ items, price }: ContextBarProps) {
  const { siteValue, siteDirection } = useSiteTranslation();
  const { t } = useTranslation();
  const validItems = items.filter(item => item.label).map(item => ({
    ...item,
    label: item.label === t('tryOn.title') ? t('contextBar.product') : item.label
  }));

  return (
    <nav className="h-[40px] md:h-[44px] flex items-center justify-between px-[var(--spacing-md)] md:px-[var(--spacing-2xl)] w-full max-w-[1440px] mx-auto overflow-x-auto no-scrollbar" dir={siteDirection()}>
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {siteValue(validItems.map((item, index) => {
          const isLast = index === validItems.length - 1;
          const isStudio = item.href?.includes('/studio');
          
          return (
            <React.Fragment key={index}>
              {siteValue(item.href && !isLast && !isStudio ? (
                <Link 
                  to={item.href}
                  className="text-[11px] md:text-[length:var(--text-caption-size)] font-[number:var(--font-weight-regular)] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
                >
                  {siteValue(item.label)}
                </Link>
              ) : (
                <span className={`text-[11px] md:text-[length:var(--text-caption-size)] ${isLast ? 'font-[number:var(--font-weight-bold)] text-[var(--foreground)]/80' : 'font-[number:var(--font-weight-regular)] text-[var(--foreground)]/30'}`}>
                  {siteValue(item.label)}
                </span>
              ))}
              {siteValue(!isLast && (
                <span className="text-[10px] text-[var(--foreground)]/10 mx-0.5">/</span>
              ))}
            </React.Fragment>
          );
        }))}
      </div>

      {siteValue(price !== undefined && (
        <div className="flex items-baseline gap-1 mr-4 shrink-0">
          <span className="font-bold text-foreground" style={{ fontSize: 'var(--text-h4-size)' }}>
            {siteValue(formatPriceFromRial(price, false))}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-medium)' }}>
            {t('common.toman')}
          </span>
        </div>
      ))}
    </nav>
  );
}