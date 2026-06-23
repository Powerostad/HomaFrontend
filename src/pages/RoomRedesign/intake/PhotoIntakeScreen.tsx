/**
 * PhotoIntakeScreen — Screen 1 of the intake flow.
 *
 * Editorial entry point: brand row → title/subtitle → tappable photo-frame
 * placeholder → primary CTA (wrapped together in PhotoPicker) → error feedback
 * → secondary tips link → three tip rows. Mobile RTL, calm + minimal.
 */
import { Camera, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { RD } from '../theme';
import { HeaderBadge } from '../components/chat';
import { INTAKE_COPY } from './intakeCopy';
import { PhotoPicker } from './PhotoPicker';

export interface PhotoIntakeScreenProps {
  onPick: (file: File, source: 'camera' | 'gallery') => void;
  preparing: boolean;
  error: string | null;
  onOpenTips: () => void;
}

export function PhotoIntakeScreen({
  onPick,
  preparing,
  error,
  onOpenTips,
}: PhotoIntakeScreenProps): JSX.Element {
  const reduce = useReducedMotion();

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'Vazirmatn, sans-serif',
        backgroundColor: RD.cream,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        paddingLeft: '20px',
        paddingRight: '20px',
        maxWidth: '520px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Brand row ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '32px',
        }}
      >
        <HeaderBadge />
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: RD.ink,
            letterSpacing: '0.01em',
          }}
        >
          {INTAKE_COPY.brand}
        </span>
      </div>

      {/* ── Center column ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flex: 1,
        }}
      >
        {/* Title */}
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: RD.ink,
            margin: 0,
            lineHeight: 1.4,
            textAlign: 'right',
          }}
        >
          {INTAKE_COPY.photo.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: reduce ? 0 : 0.05 }}
          style={{
            fontSize: '14px',
            color: RD.inkSoft,
            lineHeight: 1.85,
            margin: 0,
            maxWidth: '34ch',
            textAlign: 'right',
          }}
        >
          {INTAKE_COPY.photo.subtitle}
        </motion.p>

        {/* ── PhotoPicker wraps both frame + CTA ─────────────────── */}
        <PhotoPicker onPick={onPick} disabled={preparing}>
          {(open) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tappable photo-frame placeholder */}
              <motion.button
                type="button"
                onClick={open}
                aria-label={INTAKE_COPY.a11y.pickPhoto}
                whileTap={preparing ? undefined : { scale: 0.97 }}
                style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  backgroundColor: '#fff',
                  border: `1.5px dashed ${RD.line}`,
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: preparing ? 'default' : 'pointer',
                  padding: 0,
                }}
              >
                <Camera size={40} strokeWidth={1.5} color={RD.inkSoft} />
                <span
                  style={{
                    fontSize: '13px',
                    color: RD.inkSoft,
                    fontFamily: 'Vazirmatn, sans-serif',
                  }}
                >
                  {INTAKE_COPY.photo.primaryCta}
                </span>
              </motion.button>

              {/* Primary CTA */}
              <motion.button
                type="button"
                onClick={open}
                disabled={preparing}
                whileTap={preparing ? undefined : { scale: 0.97 }}
                style={{
                  width: '100%',
                  height: '52px',
                  backgroundColor: preparing ? RD.inkSoft : RD.green,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '18px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: 'Vazirmatn, sans-serif',
                  cursor: preparing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s ease-out',
                }}
                aria-busy={preparing}
              >
                {preparing && (
                  <span
                    aria-hidden
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: reduce ? 'none' : 'spin 0.7s linear infinite',
                    }}
                  />
                )}
                {INTAKE_COPY.photo.primaryCta}
              </motion.button>

              {/* Inline spinner keyframes (injected once) */}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </PhotoPicker>

        {/* Error message */}
        {error && (
          <p
            role="alert"
            style={{
              fontSize: '13px',
              color: RD.danger,
              margin: 0,
              textAlign: 'right',
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        )}

        {/* Secondary text button → tips sheet */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <motion.button
            type="button"
            onClick={onOpenTips}
            whileTap={{ scale: 0.96 }}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 0',
              fontSize: '13px',
              color: RD.inkSoft,
              fontFamily: 'Vazirmatn, sans-serif',
              cursor: 'pointer',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none';
            }}
          >
            {INTAKE_COPY.photo.secondaryCta}
          </motion.button>
        </div>

        {/* ── Tip rows (staggered entrance) ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {INTAKE_COPY.photo.tips.map((tip, i) => (
            <motion.div
              key={tip}
              initial={{ opacity: 0, y: reduce ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduce ? 0 : 0.1 + i * 0.04,
                duration: 0.2,
                ease: 'easeOut',
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Check size={14} strokeWidth={2.5} color={RD.accentGreen} style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '13px',
                  color: RD.inkSoft,
                  lineHeight: 1.6,
                  textAlign: 'right',
                }}
              >
                {tip}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
