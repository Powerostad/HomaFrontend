/**
 * ContextLock — Editorial / Zara Home Style
 * Minimal project context bar (only used on mobile now).
 */
import { motion } from 'motion/react';

const FONT = 'var(--font-family-vazirmatn)';
const FONT_SERIF = 'var(--font-family-serif)';

interface ContextLockProps {
  projectName: string;
  targetStyle: string;
  variant?: 'mobile' | 'desktop';
}

export function ContextLock({
  projectName,
  targetStyle,
  variant = 'mobile',
}: ContextLockProps) {
  const isDesktop = variant === 'desktop';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full z-50 sticky top-0"
      dir="rtl"
      style={{
        fontFamily: FONT,
        background: 'var(--editorial-stone)',
        borderBottom: '1px solid var(--editorial-hairline)',
        padding: isDesktop ? '20px 32px' : '14px 20px',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Project Name */}
        <div className="flex flex-col gap-0 min-w-0">
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontStyle: 'italic',
              fontSize: 'var(--text-caption-size)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--editorial-taupe)',
            }}
            dir="ltr"
          >
            پروژه شما — تحلیل اختصاصی
          </span>
          <span
            className="truncate"
            style={{
              fontSize: isDesktop ? 'var(--text-h4-size)' : 'var(--text-label-size)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--editorial-charcoal)',
              fontFamily: FONT,
              letterSpacing: '-0.01em',
            }}
          >
            {projectName}
          </span>
        </div>

        {/* Target Style — Subtle */}
        {targetStyle && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--editorial-taupe)',
              fontFamily: FONT,
              letterSpacing: '0.04em',
            }}
            dir="ltr"
          >
            {targetStyle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
