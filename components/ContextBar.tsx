import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContextBarProps {
  items: BreadcrumbItem[];
  price?: number;
}

export function ContextBar({ items, price }: ContextBarProps) {
  const validItems = items.filter(item => item.label).map(item => ({
    ...item,
    label: item.label === 'امتحان در فضای تو' ? 'محصول' : item.label
  }));

  return (
    <nav className="h-[40px] md:h-[44px] flex items-center justify-between px-[var(--spacing-md)] md:px-[var(--spacing-2xl)] w-full max-w-[1440px] mx-auto overflow-x-auto no-scrollbar" dir="rtl">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {validItems.map((item, index) => {
          const isLast = index === validItems.length - 1;
          const isStudio = item.label === 'استودیو' || item.href?.includes('/studio');
          
          return (
            <React.Fragment key={index}>
              {item.href && !isLast && !isStudio ? (
                <Link 
                  to={item.href}
                  className="text-[11px] md:text-[length:var(--text-caption-size)] font-[number:var(--font-weight-regular)] text-[var(--foreground)]/30 hover:text-[var(--foreground)]/60 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`text-[11px] md:text-[length:var(--text-caption-size)] ${isLast ? 'font-[number:var(--font-weight-bold)] text-[var(--foreground)]/80' : 'font-[number:var(--font-weight-regular)] text-[var(--foreground)]/30'}`}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-[10px] text-[var(--foreground)]/10 mx-0.5">/</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {price !== undefined && (
        <div className="flex items-baseline gap-1 mr-4 shrink-0">
          <span className="font-bold text-foreground" style={{ fontSize: 'var(--text-h4-size)' }}>
            {price.toLocaleString('fa-IR')}
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 'var(--text-caption-size)', fontWeight: 'var(--font-weight-medium)' }}>
            تومان
          </span>
        </div>
      )}
    </nav>
  );
}