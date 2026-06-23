/**
 * HomaIntakeFlow — the pre-analysis intake flow that runs BEFORE the
 * conversational redesign/analysis screen.
 *
 * Two interactive steps:
 *   1. PhotoIntakeScreen        — capture/upload one room photo (required)
 *   2. PhotoReviewContextScreen — review the photo + add optional context
 *
 * On "start analysis" it builds a typed HomaIntakePayload and navigates to
 * `/redesign` with the payload in `location.state`. The loading + analysis
 * stages live on the destination (RoomRedesignPage owns the chat hook + SSE).
 *
 * The bad-photo warning is shown at the submit gate (not mid-pick), per the V1
 * product decision: warn on small/low-quality photos but always allow continue.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { RD } from '../theme';
import { useIntakeFlow } from './useIntakeFlow';
import { INTAKE_COPY } from './intakeCopy';
import type { RedesignLocationState } from './intakeTypes';
import { PhotoIntakeScreen } from './PhotoIntakeScreen';
import { PhotoTipsBottomSheet } from './PhotoTipsBottomSheet';
import { PhotoReviewContextScreen } from './PhotoReviewContextScreen';
import { BadPhotoWarning } from './BadPhotoWarning';

export function HomaIntakeFlow(): JSX.Element {
  const navigate = useNavigate();
  const flow = useIntakeFlow();
  const reduce = useReducedMotion();

  const [tipsOpen, setTipsOpen] = useState(false);
  const [warnOpen, setWarnOpen] = useState(false);

  // Hand the structured payload to the analysis/chat flow.
  const startAnalysis = () => {
    const payload = flow.buildPayload();
    if (!payload) {
      toast.error(INTAKE_COPY.errors.noPhoto);
      return;
    }
    const state: RedesignLocationState = { intake: payload };
    navigate('/redesign', { state });
  };

  const onSubmit = () => {
    if (!flow.image) {
      toast.error(INTAKE_COPY.errors.noPhoto);
      return;
    }
    if (flow.imageTooSmall) {
      setWarnOpen(true);
      return;
    }
    startAnalysis();
  };

  const onContinueAnyway = () => {
    setWarnOpen(false);
    startAnalysis();
  };

  // "Take a new photo" → drop the current one and return to the capture screen.
  const onRetryPhoto = () => {
    setWarnOpen(false);
    flow.removeImage();
  };

  const D = reduce ? 0 : 0.26;
  const enter = { opacity: 0, x: reduce ? 0 : 24 };
  const exit = { opacity: 0, x: reduce ? 0 : -24 };

  return (
    <div
      className="relative w-full max-w-[520px] mx-auto"
      style={{ backgroundColor: RD.cream, minHeight: '100dvh', fontFamily: 'Vazirmatn, sans-serif' }}
      dir="rtl"
    >
      <AnimatePresence mode="wait" initial={false}>
        {flow.step === 'context' && flow.image ? (
          <motion.div
            key="context"
            initial={enter}
            animate={{ opacity: 1, x: 0 }}
            exit={exit}
            transition={{ duration: D, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhotoReviewContextScreen
              image={flow.image}
              preparing={flow.preparing}
              onPick={flow.pickImage}
              onBack={flow.back}
              roomType={flow.roomType}
              onSelectRoomType={flow.setRoomType}
              goals={flow.goals}
              onToggleGoal={flow.toggleGoal}
              note={flow.note}
              onNoteChange={flow.setNote}
              onSubmit={onSubmit}
            />
          </motion.div>
        ) : (
          <motion.div
            key="photo"
            initial={enter}
            animate={{ opacity: 1, x: 0 }}
            exit={exit}
            transition={{ duration: D, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhotoIntakeScreen
              onPick={flow.pickImage}
              preparing={flow.preparing}
              error={flow.error}
              onOpenTips={() => setTipsOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <PhotoTipsBottomSheet open={tipsOpen} onClose={() => setTipsOpen(false)} />
      <BadPhotoWarning
        open={warnOpen}
        onRetry={onRetryPhoto}
        onContinue={onContinueAnyway}
        onClose={() => setWarnOpen(false)}
      />
    </div>
  );
}

export default HomaIntakeFlow;
