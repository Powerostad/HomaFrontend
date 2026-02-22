/**
 * Download Ready Modal — Quiet Luxury Redesign
 * Clean glass dialog for download confirmation.
 */
import { Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useSimpleTranslation } from './types';

const FONT = 'var(--font-family-vazirmatn)';

interface DownloadReadyModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function DownloadReadyModal({ onConfirm, onCancel }: DownloadReadyModalProps) {
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
          gap: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--muted)',
          }}
        >
          <Download size={24} style={{ color: 'var(--foreground)', opacity: 0.7 }} />
        </div>

        <div className="flex flex-col gap-2">
          <h3
            style={{
              fontSize: 'var(--text-h3-size)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--foreground)',
              fontFamily: FONT,
            }}
          >
            {t('studio.result.imageReady', 'تصویر آماده است')}
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
            {t('studio.result.clickToSave', 'برای ذخیره تصویر روی دکمه زیر کلیک کنید')}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onConfirm}
            className="btn-primary-dark w-full flex items-center justify-center gap-2"
            style={{
              borderRadius: 'var(--btn-dark-radius)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: FONT,
            }}
          >
            <Download size={16} />
            {t('studio.result.saveImage', 'ذخیره تصویر')}
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
