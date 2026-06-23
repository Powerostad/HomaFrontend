/**
 * BadPhotoWarning — bottom-sheet warning shown when the uploaded photo is
 * unlikely to yield a quality analysis.
 *
 * Offers two actions: retry (pick a new photo) or continue anyway with the
 * existing photo. Swipe-to-dismiss and overlay tap both call onClose.
 */
import { AlertTriangle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { RD } from '../theme';
import { INTAKE_COPY } from './intakeCopy';

const TAP = { scale: 0.97 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

interface BadPhotoWarningProps {
  open: boolean;
  onRetry: () => void;
  onContinue: () => void;
  onClose: () => void;
}

export function BadPhotoWarning({ open, onRetry, onContinue, onClose }: BadPhotoWarningProps): JSX.Element {
  const reduce = useReducedMotion();
  const tap = reduce ? undefined : TAP;
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent>
        <DrawerTitle className="sr-only">
          {INTAKE_COPY.badPhoto.title}
        </DrawerTitle>
        <div
          dir="rtl"
          style={{
            fontFamily: 'Vazirmatn, sans-serif',
            padding: '24px 20px',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ── Warning badge + text ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: RD.warningBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={28} strokeWidth={2} color={RD.warning} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: RD.ink,
                  margin: 0,
                  lineHeight: '1.4',
                }}
              >
                {INTAKE_COPY.badPhoto.title}
              </h2>
              <p
                style={{
                  fontSize: '13.5px',
                  color: RD.inkSoft,
                  margin: 0,
                  lineHeight: '1.75',
                }}
              >
                {INTAKE_COPY.badPhoto.body}
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Primary: retry */}
            <motion.button
              type="button"
              onClick={onRetry}
              whileTap={tap}
              transition={SPRING}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: RD.green,
                color: '#fff',
                fontFamily: 'Vazirmatn, sans-serif',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {INTAKE_COPY.badPhoto.retry}
            </motion.button>

            {/* Secondary: continue anyway */}
            <motion.button
              type="button"
              onClick={onContinue}
              whileTap={tap}
              transition={SPRING}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                color: RD.inkSoft,
                fontFamily: 'Vazirmatn, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                border: `1px solid ${RD.line}`,
                cursor: 'pointer',
              }}
            >
              {INTAKE_COPY.badPhoto.continueAnyway}
            </motion.button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
