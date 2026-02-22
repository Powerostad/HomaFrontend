/**
 * ExitDecisionModal - "Save before exit?" modal
 *
 * Three buttons: Save & Exit, Exit Without Saving, Cancel.
 * Uses Motion for enter/exit animation.
 * Frosted glass design.
 */
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

interface ExitDecisionModalProps {
  isOpen: boolean;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onCancel: () => void;
}

export function ExitDecisionModal({
  isOpen,
  onSaveAndExit,
  onExitWithoutSaving,
  onCancel,
}: ExitDecisionModalProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-modal flex items-center justify-center p-6"
          style={{
            background: 'rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 'var(--radius-3xl, 24px)',
              padding: '32px 28px',
              boxShadow: 'var(--elevation-xl)',
              gap: '28px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-content-primary">
                {t('studio.result.v2.exit.title', 'ذخیره و خروج')}
              </h3>
              <p className="text-sm text-content-muted leading-7">
                {t('studio.result.v2.exit.description', 'طراحی شما ذخیره شده و به استودیو باز می\u200Cگردید.')}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={onSaveAndExit}
                className="w-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-[0.97]"
                style={{
                  height: 'var(--btn-dark-h-mobile, 48px)',
                  borderRadius: 'var(--radius-lg, 8px)',
                  background: 'var(--content-primary)',
                  border: 'none',
                  color: 'var(--surface-page)',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {t('studio.result.v2.exit.saveAndExit', 'ذخیره و خروج')}
              </button>
              <button
                onClick={onExitWithoutSaving}
                className="w-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-[0.97]"
                style={{
                  height: 'var(--btn-dark-h-mobile, 48px)',
                  borderRadius: 'var(--radius-lg, 8px)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-default)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--content-primary)',
                }}
              >
                {t('studio.result.v2.exit.exitWithoutSaving', 'خروج بدون ذخیره')}
              </button>
              <button
                onClick={onCancel}
                className="w-full flex items-center justify-center cursor-pointer transition-all duration-200"
                style={{
                  height: 'var(--btn-dark-h-mobile, 48px)',
                  borderRadius: 'var(--radius-lg, 8px)',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--content-muted)',
                }}
              >
                {t('common.cancel', 'انصراف')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
