/**
 * AnalysisLoadingScreen — Screen 3 of the intake flow.
 *
 * Full-screen overlay shown while the first-turn analysis is in progress.
 * Displays a preview of the uploaded room photo, an animated loading indicator
 * with rotating status messages, or an error state with a retry button.
 *
 * Purely presentational — no navigation logic.
 */

import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { RD } from '../theme';
import { INTAKE_COPY } from './intakeCopy';

// ── Prop interface (exact contract) ────────────────────────────────────────
interface AnalysisLoadingScreenProps {
  imageUrl?: string;   // the uploaded room photo to preview
  stage?: string | null; // live backend phase label (Persian); null before first stage
  error?: boolean;     // first-turn analysis failed → show error + retry
  onRetry?: () => void;// re-run analysis
}

// ── Animated dots (normal state loading indicator) ──────────────────────────
function PulsingDots({ reduced }: { reduced: boolean }) {
  if (reduced) {
    // Static dots for reduced-motion preference
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: RD.inkSoft,
              display: 'block',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.22,
          }}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: RD.inkSoft,
            display: 'block',
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function AnalysisLoadingScreen({
  imageUrl,
  stage,
  error = false,
  onRetry,
}: AnalysisLoadingScreenProps): JSX.Element {
  const reduced = useReducedMotion() ?? false;
  // Real backend phase, with a neutral fallback until the first stage arrives.
  const statusText = stage?.trim() || INTAKE_COPY.loading.preparing;

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        backgroundColor: RD.cream,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        paddingLeft: '20px',
        paddingRight: '20px',
        fontFamily: 'Vazirmatn, sans-serif',
        overflowY: 'auto',
      }}
    >
      {/* Inner column — constrained width */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {/* ── Photo preview / placeholder ─────────────────────────────── */}
        {imageUrl ? (
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            {/* Entrance animation — fade + slight rise */}
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <ImageWithFallback
                src={imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Subtle darkening scrim */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(28,28,26,0.18)',
                  borderRadius: '20px',
                  pointerEvents: 'none',
                }}
              />
              {/* Soft sheen highlight (top) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background:
                    'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)',
                  borderRadius: '20px 20px 0 0',
                  pointerEvents: 'none',
                }}
              />
            </motion.div>
          </div>
        ) : (
          /* Neutral placeholder card when no image available */
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: '360px',
              aspectRatio: '4/3',
              borderRadius: '20px',
              backgroundColor: RD.greenTintBg,
              border: `1px solid ${RD.line}`,
            }}
          />
        )}

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {!error && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <PulsingDots reduced={reduced} />

            {/* Rotating status text with crossfade */}
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{
                minHeight: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={statusText}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduced ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: RD.ink,
                    textAlign: 'center',
                    direction: 'rtl',
                    fontFamily: 'Vazirmatn, sans-serif',
                  }}
                >
                  {statusText}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
              maxWidth: '320px',
            }}
          >
            <AlertTriangle
              size={32}
              strokeWidth={1.8}
              color={RD.warning}
            />

            <span
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: RD.ink,
                lineHeight: '1.5',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
              }}
            >
              {INTAKE_COPY.errors.analysisFailedTitle}
            </span>

            <span
              style={{
                fontSize: '14px',
                color: RD.inkSoft,
                lineHeight: '1.75',
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
              }}
            >
              {INTAKE_COPY.errors.analysisFailedBody}
            </span>

            {onRetry && (
              <motion.button
                type="button"
                onClick={onRetry}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  marginTop: '4px',
                  height: '48px',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  borderRadius: '999px',
                  backgroundColor: RD.green,
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'Vazirmatn, sans-serif',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '160px',
                }}
              >
                {INTAKE_COPY.errors.analysisRetry}
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
