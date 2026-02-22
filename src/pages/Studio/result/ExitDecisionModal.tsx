/**
 * Exit Decision Modal — Quiet Luxury Redesign
 * Clean glass dialog with refined typography.
 */
import { motion } from 'motion/react';
import { useSimpleTranslation } from './types';

const FONT = 'var(--font-family-vazirmatn)';

interface ExitDecisionModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitDecisionModal({ onConfirm, onCancel }: ExitDecisionModalProps) {
  const { t } = useSimpleTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[3000] flex items-center justify-center p-6"
      style={{
        background: 'rgba(0,0,0,0.08)',
        backdropFilter: 'blur(var(--blur-md))',
        WebkitBackdropFilter: 'blur(var(--blur-md))',
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[340px] w-full flex flex-col items-center text-center"
        style={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(var(--blur-xl))',
          WebkitBackdropFilter: 'blur(var(--blur-xl))',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 'var(--radius-3xl)',
          padding: '32px 28px',
          boxShadow: 'var(--elevation-xl)',
          fontFamily: FONT,
          gap: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <h3
            style={{
              fontSize: 'var(--text-h3-size)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              fontFamily: FONT,
            }}
          >
            {t('studio.result.saveAndExit', 'ذخیره و خروج')}
          </h3>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              fontFamily: FONT,
              lineHeight: '1.7',
            }}
          >
            {t('studio.result.exitDescription', 'طراحی شما ذخیره شده و به استودیو باز می‌گردید.')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onConfirm}
            className="btn-primary-dark w-full"
            style={{
              borderRadius: 'var(--btn-dark-radius)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: FONT,
            }}
          >
            {t('studio.result.confirmAndReturn', 'تایید و بازگشت')}
          </button>
          <button
            onClick={onCancel}
            className="w-full transition-all duration-200 active:scale-[0.97]"
            style={{
              height: 'var(--btn-dark-h-desktop)',
              borderRadius: 'var(--btn-dark-radius)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              fontFamily: FONT,
            }}
          >
            {t('common.cancel', 'انصراف')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
