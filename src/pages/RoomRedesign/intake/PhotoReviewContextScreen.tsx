/**
 * PhotoReviewContextScreen — Screen 2 of the intake flow.
 *
 * Displays the captured photo with a "change photo" action, then collects
 * optional context: room type (single-select), redesign goals (multi-select),
 * and a free-text note. A sticky bottom CTA kicks off the analysis.
 *
 * Layout: sticky top bar → scrollable body → sticky bottom CTA.
 * RTL, Vazirmatn, RD tokens throughout.
 */
import { ChevronRight, Camera } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { RD } from '../theme';
import { INTAKE_COPY } from './intakeCopy';
import type { Goal, IntakeImage, RoomType } from './intakeTypes';
import { PhotoPicker } from './PhotoPicker';
import { RoomTypeSelector } from './RoomTypeSelector';
import { GoalChips } from './GoalChips';
import { OptionalUserNoteInput } from './OptionalUserNoteInput';

const TAP = { scale: 0.97 };
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 30 };

interface PhotoReviewContextScreenProps {
  image: IntakeImage;
  preparing: boolean;
  onPick: (file: File, source: 'camera' | 'gallery') => void;
  onBack: () => void;
  roomType?: RoomType;
  onSelectRoomType: (rt: RoomType) => void;
  goals: Set<Goal>;
  onToggleGoal: (g: Goal) => void;
  note: string;
  onNoteChange: (v: string) => void;
  onSubmit: () => void;
}

export function PhotoReviewContextScreen({
  image,
  preparing,
  onPick,
  onBack,
  roomType,
  onSelectRoomType,
  goals,
  onToggleGoal,
  note,
  onNoteChange,
  onSubmit,
}: PhotoReviewContextScreenProps): JSX.Element {
  const reduce = useReducedMotion();

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: 'Vazirmatn, sans-serif',
        backgroundColor: RD.cream,
        minHeight: '100dvh',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* ── Sticky top bar ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: RD.cream,
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
          paddingBottom: '12px',
          paddingLeft: '8px',
          paddingRight: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${RD.line}`,
        }}
      >
        {/* Back button — RTL: back is to the right */}
        <motion.button
          type="button"
          aria-label={INTAKE_COPY.a11y.back}
          onClick={onBack}
          whileTap={TAP}
          transition={SPRING}
          style={{
            position: 'absolute',
            right: '8px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: RD.ink,
          }}
        >
          <ChevronRight size={22} strokeWidth={2} color={RD.ink} />
        </motion.button>

        {/* Centered title */}
        <span
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: RD.ink,
            textAlign: 'center',
          }}
        >
          {INTAKE_COPY.review.title}
        </span>
      </div>

      {/* ── Scrollable body ────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 0',
          // Clears the sticky CTA bar (52px button + 32px padding) plus the home
          // indicator safe area, so the last field never hides behind it.
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* ── Photo section ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: RD.ink,
              textAlign: 'right',
            }}
          >
            {INTAKE_COPY.review.photoLabel}
          </span>

          {/* Photo thumbnail with optional preparing overlay */}
          <div
            aria-busy={preparing}
            style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={image.dataUrl}
              alt={INTAKE_COPY.a11y.photoAlt}
              style={{
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                display: 'block',
                borderRadius: '16px',
              }}
            />
            {preparing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(250,249,246,0.72)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                }}
              >
                {/* Simple CSS spinner */}
                <span
                  aria-hidden
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `3px solid ${RD.line}`,
                    borderTopColor: RD.ink,
                    animation: reduce ? 'none' : 'spin 0.7s linear infinite',
                  }}
                />
              </div>
            )}
          </div>

          {/* Change photo trigger */}
          <PhotoPicker onPick={onPick} disabled={preparing}>
            {(open) => (
              <motion.button
                type="button"
                onClick={open}
                disabled={preparing}
                whileTap={preparing ? undefined : TAP}
                transition={SPRING}
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${RD.line}`,
                  color: RD.inkSoft,
                  fontFamily: 'Vazirmatn, sans-serif',
                  fontSize: '13px',
                  cursor: preparing ? 'not-allowed' : 'pointer',
                  opacity: preparing ? 0.5 : 1,
                }}
              >
                <Camera size={14} strokeWidth={2} color={RD.inkSoft} />
                {INTAKE_COPY.review.changePhoto}
              </motion.button>
            )}
          </PhotoPicker>
        </div>

        {/* ── Room type selector ── */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.08, duration: 0.25, ease: 'easeOut' }}
        >
          <RoomTypeSelector value={roomType} onSelect={onSelectRoomType} />
        </motion.div>

        {/* ── Goal chips ── */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.14, duration: 0.25, ease: 'easeOut' }}
        >
          <GoalChips selected={goals} onToggle={onToggleGoal} />
        </motion.div>

        {/* ── Optional note ── */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.2, duration: 0.25, ease: 'easeOut' }}
        >
          <OptionalUserNoteInput value={note} onChange={onNoteChange} />
        </motion.div>
      </div>

      {/* ── Sticky bottom CTA bar ──────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: RD.cream,
          borderTop: `1px solid ${RD.line}`,
          padding: '16px 20px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}
      >
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={preparing}
          aria-busy={preparing}
          whileTap={preparing ? undefined : TAP}
          transition={SPRING}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: RD.green,
            color: '#fff',
            fontFamily: 'Vazirmatn, sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: preparing ? 'default' : 'pointer',
            opacity: preparing ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {INTAKE_COPY.review.submitCta}
        </motion.button>
      </div>

      {/* Spinner keyframe (inline style tag) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
